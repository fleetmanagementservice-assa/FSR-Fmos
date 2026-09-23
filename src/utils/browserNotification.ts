/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isAutoSyncEnabled } from '../db/supabaseClient';
import { localDb } from '../db/localDb';
import { OperationUser, Notification as FsrNotification, Fsr } from '../types';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

/**
 * Check the current browser notification permission
 */
export function getNotificationPermissionStatus(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionState;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      playNotificationChime();
    }
    return permission as NotificationPermissionState;
  } catch (err) {
    console.warn('[BrowserNotification] Error requesting permission:', err);
    return getNotificationPermissionStatus();
  }
}

/**
 * Synthesizes a clean, pleasant notification chime using Web Audio API
 */
export function playNotificationChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Harmonic sequence: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz)
    const notes = [
      { freq: 523.25, time: 0, duration: 0.12 },
      { freq: 659.25, time: 0.08, duration: 0.14 },
      { freq: 783.99, time: 0.16, duration: 0.28 }
    ];

    notes.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0.001, now + time);
      gain.gain.exponentialRampToValueAtTime(0.18, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + duration);
    });
  } catch (err) {
    // Non-fatal, browser audio might be restricted before first user interaction
    console.debug('[BrowserNotification] Audio playback skipped:', err);
  }
}

export interface ShowNotificationOptions {
  body?: string;
  icon?: string;
  tag?: string;
  fsrId?: string;
  playSound?: boolean;
}

/**
 * Send native browser desktop notification and play chime
 */
export function sendBrowserNotification(
  title: string,
  options: ShowNotificationOptions = {}
): Notification | null {
  const { body = '', fsrId, playSound = true } = options;

  // Play audible alert
  if (playSound) {
    playNotificationChime();
  }

  // Trigger custom in-app banner event
  window.dispatchEvent(
    new CustomEvent('in_app_notification_toast', {
      detail: { title, body, fsrId, timestamp: new Date().toISOString() }
    })
  );

  if (getNotificationPermissionStatus() !== 'granted') {
    return null;
  }

  try {
    const notifOptions: NotificationOptions = {
      body,
      icon: options.icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: options.tag || (fsrId ? `fsr-${fsrId}` : `fmos-notif-${Date.now()}`),
      data: { fsrId }
    };

    const notification = new Notification(title, notifOptions);

    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();

      if (fsrId) {
        window.dispatchEvent(new CustomEvent('switch_tab', { detail: 'fsr-monitoring' }));
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('fsr_select_detail', { detail: { fsrId } })
          );
        }, 120);
      }
      notification.close();
    };

    return notification;
  } catch (err) {
    console.warn('[BrowserNotification] Failed to show Notification instance:', err);
    return null;
  }
}

/**
 * Check whether a notification item applies to a given active user
 */
export function isNotificationRelevantForUser(notif: FsrNotification, user: OperationUser): boolean {
  if (user.role_operation === 'Super Admin') return true;

  // Role matching
  const roleMatches =
    notif.user_role === user.role_operation ||
    ((user.role_operation === 'SA' || user.role_operation === 'SS') &&
      (notif.user_role === 'SA' || notif.user_role === 'SS'));

  if (!roleMatches) return false;

  // If there's an associated FSR, perform fine-grained role checks
  if (notif.fsr_id) {
    const fsr = localDb.getFsrById(notif.fsr_id);
    if (fsr) {
      if (user.role_operation === 'TS') {
        return localDb.isTsMatchingUser(user, fsr.nama_ts);
      }
      if (user.role_operation === 'Vendor') {
        return localDb.isVendorMatchingFsr(user, fsr);
      }
      if (user.role_operation === 'SA' || user.role_operation === 'SS') {
        if (fsr.kategori_layanan !== 'Maintenance' && fsr.kategori_layanan !== 'Body Repair') {
          return false;
        }
        if (user.cabang_handling && user.cabang_handling !== 'All Branches' && user.cabang_handling !== 'All') {
          return localDb.isBranchMatching(user.cabang_handling, fsr.cabang);
        }
      }
      if (user.role_operation === 'VRO') {
        if (fsr.kategori_layanan !== 'Document') {
          return false;
        }
        if (user.cabang_handling && user.cabang_handling !== 'All Branches' && user.cabang_handling !== 'All') {
          return localDb.isBranchMatching(user.cabang_handling, fsr.cabang);
        }
      }
    }
  }

  return true;
}

/**
 * Global Realtime Notification Subscriber
 * Subscribes to local events and Supabase Postgres changes to deliver real-time notifications
 */
export function initRealtimeNotificationListener(getCurrentUser: () => OperationUser | null): () => void {
  // 1. Listen for local notification events dispatched within the tab
  const handleLocalNotification = (e: Event) => {
    const customEvent = e as CustomEvent<FsrNotification>;
    const notif = customEvent.detail;
    const user = getCurrentUser();
    if (!notif || !user) return;

    if (isNotificationRelevantForUser(notif, user)) {
      sendBrowserNotification(notif.title, {
        body: notif.message,
        fsrId: notif.fsr_id,
        tag: `notif-${notif.id}`
      });
    }
  };

  window.addEventListener('fsr_new_notification', handleLocalNotification);

  // 2. Set up Supabase Realtime Channel
  let channel: any = null;
  if (isAutoSyncEnabled()) {
    try {
      channel = supabase
        .channel('public:fsr_and_notifications_alerts')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications' },
          (payload: any) => {
            const raw = payload.new;
            const user = getCurrentUser();
            if (!raw || !user) return;

            const notif: FsrNotification = {
              id: raw.id,
              user_role: raw.target_role || raw.user_role,
              title: raw.title,
              message: raw.message,
              fsr_id: raw.fsr_id,
              is_read: Boolean(raw.is_read),
              created_at: raw.created_at || new Date().toISOString()
            };

            // Dispatch local update
            window.dispatchEvent(new CustomEvent('fsr_db_updated'));

            if (isNotificationRelevantForUser(notif, user)) {
              sendBrowserNotification(notif.title, {
                body: notif.message,
                fsrId: notif.fsr_id,
                tag: `notif-${notif.id}`
              });
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'fsr' },
          (payload: any) => {
            const updatedFsr = payload.new as Fsr;
            const user = getCurrentUser();
            window.dispatchEvent(new CustomEvent('fsr_db_updated'));

            if (updatedFsr && user) {
              // Notify user if this FSR belongs to them or is in their workflow
              const isRelevant =
                (user.role_operation === 'TS' && localDb.isTsMatchingUser(user, updatedFsr.nama_ts)) ||
                (user.role_operation === 'Vendor' && localDb.isVendorMatchingFsr(user, updatedFsr)) ||
                (user.role_operation === 'Admin Customer' && (updatedFsr.created_by === user.username || updatedFsr.nama_pic_customer === user.nama)) ||
                (user.role_operation === 'Leader Customer' && updatedFsr.status === 'Waiting Approval Leader Customer');

              if (isRelevant) {
                sendBrowserNotification(`Update Status FSR ${updatedFsr.no_fsr}`, {
                  body: `Status unit ${updatedFsr.no_polisi} kini: ${updatedFsr.status}`,
                  fsrId: updatedFsr.id,
                  tag: `fsr-update-${updatedFsr.id}`
                });
              }
            }
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log('[FMOS] Real-time notifications channel subscribed successfully');
          }
        });
    } catch (err) {
      console.warn('[FMOS] Real-time subscription setup caught error:', err);
    }
  }

  return () => {
    window.removeEventListener('fsr_new_notification', handleLocalNotification);
    if (channel) {
      supabase.removeChannel(channel).catch(() => {});
    }
  };
}
