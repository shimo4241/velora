"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import {
  subscribeToMessages,
  subscribeToConversations,
  sendMessage,
  markConversationAsRead,
} from "@/services";
import type { Message, Conversation } from "@/types";
import { logger } from "@/lib/logger";

export function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const uid = user?.uid ?? null;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // Reset state when conversationId changes — done via useEffect, not mid-render
  const prevConversationIdRef = useRef<string | null>(conversationId);
  useEffect(() => {
    if (conversationId !== prevConversationIdRef.current) {
      prevConversationIdRef.current = conversationId;
      setMessages([]);
      setLoading(!!conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !uid) {
      return;
    }

    let active = true;
    logger.debug(`[useMessages] subscribing conv=${conversationId}`);

    const unsubscribe = subscribeToMessages(conversationId, (loadedMessages) => {
      if (!active) return;
      setMessages(loadedMessages);
      setLoading(false);

      // Auto-mark conversation as read when active
      void markConversationAsRead(conversationId, uid);
    });

    return () => {
      active = false;
      logger.debug(`[useMessages] unsubscribing conv=${conversationId}`);
      unsubscribe();
    };
  }, [conversationId, uid]);

  const send = async (text: string) => {
    if (!conversationId || !uid || !profile) {
      throw new Error("Cannot send message: unauthenticated or no active conversation");
    }
    const trimmed = text.trim();
    if (!trimmed) return;

    await sendMessage(conversationId, uid, profile.fullName, trimmed);
  };

  return {
    messages,
    loading,
    error: null,
    send,
  };
}

export function useConversations() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(!!uid);

  // Reset state when uid changes — done via useEffect, not mid-render
  const prevUidRef = useRef<string | null>(uid);
  useEffect(() => {
    if (uid !== prevUidRef.current) {
      prevUidRef.current = uid;
      setConversations([]);
      setLoading(!!uid);
    }
  }, [uid]);

  useEffect(() => {
    if (!uid) {
      return;
    }

    let active = true;
    logger.debug(`[useConversations] subscribing uid=${uid}`);

    const unsubscribe = subscribeToConversations(uid, (data) => {
      if (!active) return;
      setConversations(data);
      setLoading(false);
    });

    return () => {
      active = false;
      logger.debug(`[useConversations] unsubscribing uid=${uid}`);
      unsubscribe();
    };
  }, [uid]);

  // Compute total unread count for current user
  const totalUnreadCount = conversations.reduce((acc, conv) => {
    if (!uid) return acc;
    return acc + (conv.unreadCounts?.[uid] || 0);
  }, 0);

  return {
    conversations,
    loading,
    totalUnreadCount,
  };
}
