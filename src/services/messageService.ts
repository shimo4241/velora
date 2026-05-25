import { logger } from "@/lib/logger";
import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  query,
  where,
  serverTimestamp,
  type DocumentData,
  Timestamp,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  type WithFieldValue,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendPushNotification } from "@/lib/fcm";
import type { Conversation, Message } from "@/types";
import { asString, asArray } from "@/utils/firestore";

export const conversationConverter: FirestoreDataConverter<Conversation> = {
  toFirestore(conv: Conversation): DocumentData {
    return conv;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Conversation {
    const data = snapshot.data(options || {});
    return {
      id: snapshot.id,
      participants: asArray<string>(data.participants),
      lastMessage: asString(data.lastMessage),
      lastMessageAt: data.lastMessageAt as Timestamp | null,
      unreadCounts: (data.unreadCounts || {}) as Record<string, number>,
      updatedAt: data.updatedAt as Timestamp | null,
    };
  },
};

export const messageConverter: FirestoreDataConverter<Message> = {
  toFirestore(msg: Message): DocumentData {
    return msg;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Message {
    const data = snapshot.data(options || {});
    return {
      id: snapshot.id,
      senderId: asString(data.senderId),
      text: asString(data.text),
      createdAt: data.createdAt as Timestamp | null,
      read: Boolean(data.read),
    };
  },
};

export function getConversationId(uid1: string, uid2: string): string {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

export async function getOrCreateConversation(uid1: string, uid2: string): Promise<string> {
  const cid = getConversationId(uid1, uid2);
  const docRef = doc(db, "conversations", cid).withConverter(conversationConverter);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    const initialConversation: WithFieldValue<Conversation> = {
      id: cid,
      participants: [uid1, uid2],
      lastMessage: "",
      lastMessageAt: null,
      unreadCounts: {
        [uid1]: 0,
        [uid2]: 0,
      },
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, initialConversation);
  }
  return cid;
}

export function subscribeToConversations(
  uid: string,
  callback: (conversations: Conversation[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(
    collection(db, "conversations").withConverter(conversationConverter),
    where("participants", "array-contains", uid)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const conversations = snapshot.docs.map((doc) => doc.data());

      conversations.sort((a, b) => {
        const timeA = a.lastMessageAt?.toMillis
          ? a.lastMessageAt.toMillis()
          : a.updatedAt?.toMillis
          ? a.updatedAt.toMillis()
          : 0;
        const timeB = b.lastMessageAt?.toMillis
          ? b.lastMessageAt.toMillis()
          : b.updatedAt?.toMillis
          ? b.updatedAt.toMillis()
          : 0;
        return timeB - timeA;
      });

      callback(conversations);
    },
    (error) => {
      logger.error(`[Firestore Error] subscribeToConversations failed for uid=${uid}`, error);
      onError?.(error);
    }
  );
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(
    collection(db, "conversations", conversationId, "messages").withConverter(messageConverter)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((doc) => doc.data());

      messages.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeA - timeB;
      });

      callback(messages);
    },
    (error) => {
      logger.error(`[Firestore Error] subscribeToMessages failed for conv=${conversationId}`, error);
      onError?.(error);
    }
  );
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  text: string
): Promise<void> {
  const conversationRef = doc(db, "conversations", conversationId).withConverter(conversationConverter);
  const convSnap = await getDoc(conversationRef);
  const data = convSnap.data();
  if (!convSnap.exists() || !data) {
    throw new Error("Conversation does not exist");
  }
  const participants = data.participants;
  const recipientId = participants.find((p) => p !== senderId) || "";

  const messagesRef = collection(db, "conversations", conversationId, "messages").withConverter(messageConverter);
  const newMsgRef = doc(messagesRef);
  const newMessage: WithFieldValue<Message> = {
    id: newMsgRef.id,
    senderId,
    text,
    createdAt: serverTimestamp(),
    read: false,
  };

  const batch = writeBatch(db);
  batch.set(newMsgRef, newMessage);

  const unreadCounts = { ...(data.unreadCounts || {}) };
  unreadCounts[recipientId] = (unreadCounts[recipientId] || 0) + 1;

  batch.update(conversationRef, {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
    unreadCounts,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();

  try {
    await sendPushNotification({
      toUid: recipientId,
      title: `Message de ${senderName}`,
      body: text.length > 60 ? `${text.substring(0, 57)}...` : text,
      data: {
        type: "direct_message",
        conversationId,
        senderId,
      },
    });
  } catch (err) {
    logger.error("Failed to send push notification for direct message:", err);
  }
}

export async function markConversationAsRead(conversationId: string, uid: string): Promise<void> {
  const conversationRef = doc(db, "conversations", conversationId);
  const convSnap = await getDoc(conversationRef);
  if (!convSnap.exists()) return;

  const data = convSnap.data();
  if (!data) return;

  const unreadCounts = { ...(data.unreadCounts || {}) };
  if ((unreadCounts[uid] || 0) === 0) {
    const messagesRef = collection(db, "conversations", conversationId, "messages");
    const q = query(messagesRef, where("read", "==", false));
    const msgSnap = await getDocs(q);
    let hasUnread = false;
    msgSnap.forEach((d) => {
      if (d.data().senderId !== uid) hasUnread = true;
    });
    if (!hasUnread) return;
  }

  unreadCounts[uid] = 0;

  const batch = writeBatch(db);
  batch.update(conversationRef, { unreadCounts });

  const messagesRef = collection(db, "conversations", conversationId, "messages");
  const q = query(messagesRef, where("read", "==", false));
  const msgSnap = await getDocs(q);
  msgSnap.forEach((msgDoc) => {
    if (msgDoc.data().senderId !== uid) {
      batch.update(msgDoc.ref, { read: true });
    }
  });

  await batch.commit();
}
