"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { logger } from "@/lib/logger";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { useFirestoreListener } from "@/hooks/useFirestoreListener";
import {
  markConversationAsRead,
  sendMessage,
  subscribeToConversations,
  subscribeToMessages,
} from "@/services";
import type { Conversation, Message } from "@/types";

const EMPTY_MESSAGES: Message[] = [];
const EMPTY_CONVERSATIONS: Conversation[] = [];

export function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const uid = user?.uid ?? null;

  const [cachedMessages, setCachedMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined" && conversationId) {
      try {
        const stored = localStorage.getItem(`velora_cached_messages_${conversationId}`);
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        logger.error(`[useMessages] Failed to parse cached messages for ${conversationId}:`, e);
      }
    }
    return [];
  });

  // Restore messages from cache when conversationId changes
  useEffect(() => {
    if (typeof window !== "undefined" && conversationId) {
      try {
        const stored = localStorage.getItem(`velora_cached_messages_${conversationId}`);
        setCachedMessages(stored ? JSON.parse(stored) : []);
      } catch (e) {
        logger.error(`[useMessages] Failed to restore cached messages for ${conversationId}:`, e);
      }
    } else {
      setCachedMessages([]);
    }
  }, [conversationId]);

  const { data, loading, error } = useFirestoreListener<Message[]>(
    conversationId && uid ? `messages:${conversationId}` : null,
    conversationId && uid
      ? (onNext, onError) =>
          subscribeToMessages(
            conversationId,
            (msgs) => {
              if (typeof window !== "undefined" && conversationId) {
                localStorage.setItem(`velora_cached_messages_${conversationId}`, JSON.stringify(msgs));
              }
              setCachedMessages(msgs);
              onNext(msgs);
            },
            onError
          )
      : null,
    EMPTY_MESSAGES
  );

  const messages = conversationId && uid ? (data !== undefined ? data : cachedMessages) : EMPTY_MESSAGES;

  const readMarkerKey = useMemo(() => {
    if (!conversationId || !uid || messages.length === 0) return "";
    const lastMessage = messages[messages.length - 1];
    return `${conversationId}:${uid}:${messages.length}:${lastMessage.id}`;
  }, [conversationId, messages, uid]);

  useEffect(() => {
    if (!conversationId || !uid || !readMarkerKey) return;
    void markConversationAsRead(conversationId, uid);
  }, [conversationId, readMarkerKey, uid]);

  const send = useCallback(
    async (text: string) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        throw new Error("Vous êtes hors ligne. Vos messages seront synchronisés une fois la connexion rétablie.");
      }
      if (!conversationId || !uid || !profile) {
        throw new Error("Cannot send message: unauthenticated or no active conversation");
      }

      const trimmed = text.trim();
      if (!trimmed) return;
      await sendMessage(conversationId, uid, profile.fullName, trimmed);
    },
    [conversationId, profile, uid]
  );

  return {
    messages,
    loading: Boolean(conversationId && uid && loading && messages.length === 0),
    error,
    send,
  };
}

export function useConversations() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [cachedConvs, setCachedConvs] = useState<Conversation[]>(() => {
    if (typeof window !== "undefined" && uid) {
      try {
        const stored = localStorage.getItem(`velora_cached_conversations_${uid}`);
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        logger.error(`[useConversations] Failed to parse cached conversations:`, e);
      }
    }
    return [];
  });

  // Restore cached conversations when user changes
  useEffect(() => {
    if (typeof window !== "undefined" && uid) {
      try {
        const stored = localStorage.getItem(`velora_cached_conversations_${uid}`);
        setCachedConvs(stored ? JSON.parse(stored) : []);
      } catch (e) {
        logger.error(`[useConversations] Failed to restore cached conversations:`, e);
      }
    } else {
      setCachedConvs([]);
    }
  }, [uid]);

  const { data, loading } = useFirestoreListener<Conversation[]>(
    uid ? `conversations:${uid}` : null,
    uid
      ? (onNext, onError) =>
          subscribeToConversations(
            uid,
            (convs) => {
              if (typeof window !== "undefined" && uid) {
                localStorage.setItem(`velora_cached_conversations_${uid}`, JSON.stringify(convs));
              }
              setCachedConvs(convs);
              onNext(convs);
            },
            onError
          )
      : null,
    EMPTY_CONVERSATIONS
  );

  const conversations = uid ? (data !== undefined ? data : cachedConvs) : EMPTY_CONVERSATIONS;
  
  const totalUnreadCount = useMemo(
    () => conversations.reduce((acc, conversation) => acc + (uid ? conversation.unreadCounts?.[uid] || 0 : 0), 0),
    [conversations, uid]
  );

  return {
    conversations,
    loading: Boolean(uid && loading && conversations.length === 0),
    totalUnreadCount,
  };
}
