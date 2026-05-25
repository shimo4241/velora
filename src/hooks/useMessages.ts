"use client";

import { useCallback, useEffect, useMemo } from "react";
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
  const { data, loading, error } = useFirestoreListener<Message[]>(
    conversationId && uid ? `messages:${conversationId}` : null,
    conversationId && uid ? (onNext, onError) => subscribeToMessages(conversationId, onNext, onError) : null,
    EMPTY_MESSAGES
  );
  const messages = conversationId && uid ? data ?? EMPTY_MESSAGES : EMPTY_MESSAGES;
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
    loading: Boolean(conversationId && uid && loading),
    error,
    send,
  };
}

export function useConversations() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const { data, loading } = useFirestoreListener<Conversation[]>(
    uid ? `conversations:${uid}` : null,
    uid ? (onNext, onError) => subscribeToConversations(uid, onNext, onError) : null,
    EMPTY_CONVERSATIONS
  );
  const conversations = uid ? data ?? EMPTY_CONVERSATIONS : EMPTY_CONVERSATIONS;
  const totalUnreadCount = useMemo(
    () => conversations.reduce((acc, conversation) => acc + (uid ? conversation.unreadCounts?.[uid] || 0 : 0), 0),
    [conversations, uid]
  );

  return {
    conversations,
    loading: Boolean(uid && loading),
    totalUnreadCount,
  };
}
