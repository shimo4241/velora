"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import {
  subscribeToMessages,
  subscribeToConversations,
  sendMessage,
  markConversationAsRead,
} from "@/lib/firestore";
import type { Message, Conversation } from "@/types";

export function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [prevConversationId, setPrevConversationId] = useState<string | null>(conversationId);

  if (conversationId !== prevConversationId) {
    setPrevConversationId(conversationId);
    setMessages([]);
    setLoading(!!conversationId);
  }

  useEffect(() => {
    if (!conversationId || !user) {
      return;
    }

    const unsubscribe = subscribeToMessages(conversationId, (loadedMessages) => {
      setMessages(loadedMessages);
      setLoading(false);
      
      // Auto-mark conversation as read when active
      void markConversationAsRead(conversationId, user.uid);
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId, user]);

  const send = async (text: string) => {
    if (!conversationId || !user || !profile) {
      throw new Error("Cannot send message: unauthenticated or no active conversation");
    }
    const trimmed = text.trim();
    if (!trimmed) return;

    await sendMessage(conversationId, user.uid, profile.fullName, trimmed);
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(!!user);
  const [prevUserId, setPrevUserId] = useState<string | undefined>(user?.uid);

  if (user?.uid !== prevUserId) {
    setPrevUserId(user?.uid);
    setConversations([]);
    setLoading(!!user);
  }

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = subscribeToConversations(user.uid, (data) => {
      setConversations(data);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Compute total unread count for current user
  const totalUnreadCount = conversations.reduce((acc, conv) => {
    if (!user) return acc;
    return acc + (conv.unreadCounts?.[user.uid] || 0);
  }, 0);

  return {
    conversations,
    loading,
    totalUnreadCount,
  };
}
