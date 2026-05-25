import { logger } from "@/lib/logger";
import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  limit,
  orderBy,
  serverTimestamp,
  type DocumentData,
  type Unsubscribe,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { sendPushNotification } from "@/lib/fcm";
import type {
  VeloraProfile,
  VeloraConnection,
  ConnectionMethod,
  ConnectionType,
  ContactRequest,
} from "@/types";
import { normalizeProfile, getProfile } from "./profileService";
import { asString, asBoolean, asNumber, dateValueToIso } from "@/utils/firestore";

export function normalizeConnection(id: string, data: DocumentData): VeloraConnection {
  const rawProfile =
    typeof data.connectedProfile === "object" && data.connectedProfile !== null
      ? data.connectedProfile
      : typeof data.profile === "object" && data.profile !== null
        ? data.profile
        : {};

  const profile = normalizeProfile(asString(data.connectedUserId, id), rawProfile as DocumentData);

  return {
    id,
    profile,
    method: (data.method || "link") as ConnectionMethod,
    userId: asString(data.userId),
    connectedUserId: asString(data.connectedUserId),
    connectionType: data.connectionType as ConnectionType | undefined,
    contextLabel: asString(data.contextLabel, asString(data.locationName)),
    introducedBy: asString(data.introducedBy),
    personalNote: asString(data.personalNote || data.notes),
    notes: asString(data.notes || data.personalNote),
    metAt: dateValueToIso(data.metAt || data.createdAt),
    eventName: asString(data.eventName || data.event),
    locationName: asString(data.locationName),
    followUpSent: asBoolean(data.followUpSent),
    tags: Array.isArray(data.tags) ? data.tags.map(t => String(t)) : [],
    event: asString(data.event),
    favorite: asBoolean(data.favorite || data.isFavorite),
    isFavorite: asBoolean(data.favorite || data.isFavorite),
    lastInteractionAt: data.lastInteractionAt ? dateValueToIso(data.lastInteractionAt) : undefined,
    connectionStrength: asNumber(data.connectionStrength, 50),
    uid: profile.id,
    username: profile.username || "",
    displayName: profile.fullName || "Membre Velora",
    photoURL: profile.avatarUrl || "",
    status: data.status || "accepted",
  };
}

export function normalizeNetworkDoc(id: string, data: DocumentData): VeloraConnection {
  const profile = normalizeProfile(data.id || id, data);

  return {
    id,
    profile,
    method: (data.method || "link") as ConnectionMethod,
    userId: asString(data.userId),
    connectedUserId: asString(data.connectedUserId || data.id || id),
    connectionType: undefined,
    contextLabel: "",
    introducedBy: "",
    personalNote: asString(data.personalNote || data.notes),
    notes: asString(data.notes || data.personalNote),
    metAt: dateValueToIso(data.metAt || data.createdAt),
    eventName: "",
    locationName: "",
    followUpSent: asBoolean(data.followUpSent),
    tags: Array.isArray(data.tags) ? data.tags.map(t => String(t)) : [],
    event: "",
    favorite: asBoolean(data.favorite || data.isFavorite),
    isFavorite: asBoolean(data.favorite || data.isFavorite),
    lastInteractionAt: data.lastInteractionAt ? dateValueToIso(data.lastInteractionAt) : undefined,
    connectionStrength: asNumber(data.connectionStrength, 72),
    uid: profile.id,
    username: profile.username || "",
    displayName: profile.fullName || "Membre Velora",
    photoURL: profile.avatarUrl || "",
    status: data.status || "accepted",
  };
}

export function normalizeContactRequest(id: string, data: DocumentData): ContactRequest {
  const rawSender =
    typeof data.senderProfile === "object" && data.senderProfile !== null
      ? data.senderProfile
      : {};
  const rawReceiver =
    typeof data.receiverProfile === "object" && data.receiverProfile !== null
      ? data.receiverProfile
      : {};

  return {
    id,
    senderId: asString(data.senderId),
    receiverId: asString(data.receiverId),
    senderProfile: normalizeProfile(asString(data.senderId), rawSender as DocumentData),
    receiverProfile: normalizeProfile(asString(data.receiverId), rawReceiver as DocumentData),
    status: (data.status || "pending") as "pending" | "accepted" | "declined",
    createdAt: dateValueToIso(data.createdAt),
    updatedAt: dateValueToIso(data.updatedAt),
    method: (data.method || "link") as ConnectionMethod,
    event: asString(data.event),
    locationName: asString(data.locationName),
    personalNote: asString(data.personalNote || data.notes),
    tags: Array.isArray(data.tags) ? data.tags.map(t => String(t)) : [],
  };
}

export const connectionConverter: FirestoreDataConverter<VeloraConnection> = {
  toFirestore(conn: VeloraConnection): DocumentData {
    return conn;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): VeloraConnection {
    return normalizeConnection(snapshot.id, snapshot.data(options || {}));
  },
};

export const networkDocConverter: FirestoreDataConverter<VeloraConnection> = {
  toFirestore(conn: VeloraConnection): DocumentData {
    return conn;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): VeloraConnection {
    return normalizeNetworkDoc(snapshot.id, snapshot.data(options || {}));
  },
};

export const contactRequestConverter: FirestoreDataConverter<ContactRequest> = {
  toFirestore(req: ContactRequest): DocumentData {
    return req;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): ContactRequest {
    return normalizeContactRequest(snapshot.id, snapshot.data(options || {}));
  },
};

export function onConnectionsChange(
  uid: string,
  callback: (connections: VeloraConnection[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  let active = true;

  const qSub = query(
    collection(db, "users", uid, "network").withConverter(networkDocConverter),
    orderBy("metAt", "desc"),
    limit(50)
  );

  const qLegacy = query(
    collection(db, "connections").withConverter(connectionConverter),
    where("userId", "==", uid),
    orderBy("metAt", "desc"),
    limit(50)
  );

  let subConnections: VeloraConnection[] = [];
  let legacyConnections: VeloraConnection[] = [];
  let subFired = false;
  let legacyFired = false;

  const triggerCallback = () => {
    if (!active) return;
    const seen = new Set<string>();
    const merged: VeloraConnection[] = [];

    for (const conn of subConnections) {
      if (conn.profile.id && !seen.has(conn.profile.id)) {
        seen.add(conn.profile.id);
        merged.push(conn);
      }
    }
    for (const conn of legacyConnections) {
      if (conn.profile.id && !seen.has(conn.profile.id)) {
        seen.add(conn.profile.id);
        merged.push(conn);
      }
    }

    logger.info(
      `[Network] uid=${uid} subDocs=${subConnections.length} legacyDocs=${legacyConnections.length} merged=${merged.length}`
    );
    callback(merged);
  };

  const unsubSub = onSnapshot(qSub, (snap) => {
    if (!active) return;
    subFired = true;
    subConnections = snap.docs.map((d) => d.data());
    triggerCallback();
  }, (error) => {
    if (!active) return;
    subFired = true;
    logger.error(`[Network:sub] Listener failed uid=${uid}`, error);
    triggerCallback();
    onError?.(error);
  });

  const unsubLegacy = onSnapshot(qLegacy, (snap) => {
    if (!active) return;
    legacyFired = true;
    legacyConnections = snap.docs.map((d) => d.data());
    triggerCallback();
  }, (error) => {
    if (!active) return;
    legacyFired = true;
    logger.error(`[Network:legacy] Listener failed uid=${uid}`, error);
    triggerCallback();
    onError?.(error);
  });

  // Suppress unused variables warnings
  void subFired;
  void legacyFired;

  return () => {
    active = false;
    unsubSub();
    unsubLegacy();
  };
}

export async function addConnectionToNetwork(
  currentUserId: string,
  viewedProfile: VeloraProfile,
  currentUserProfile?: VeloraProfile
): Promise<void> {
  if (currentUserId === viewedProfile.id) {
    throw new Error("Cannot connect to yourself");
  }

  let userProfile = currentUserProfile;
  if (!userProfile) {
    const fetchedProfile = await getProfile(currentUserId);
    if (!fetchedProfile) {
      throw new Error("Current user profile not found");
    }
    userProfile = fetchedProfile;
  }

  const batch = writeBatch(db);

  const receiverSnap = {
    id: viewedProfile.id,
    fullName: viewedProfile.fullName,
    avatarUrl: viewedProfile.avatarUrl || null,
    title: viewedProfile.title || null,
    company: viewedProfile.company || null,
    professionalMode: viewedProfile.professionalMode || "entrepreneur",
    username: viewedProfile.username || "",
  };

  const senderSnap = {
    id: userProfile.id,
    fullName: userProfile.fullName,
    avatarUrl: userProfile.avatarUrl || null,
    title: userProfile.title || null,
    company: userProfile.company || null,
    professionalMode: userProfile.professionalMode || "entrepreneur",
    username: userProfile.username || "",
  };

  batch.set(doc(db, "connections", `${currentUserId}_${viewedProfile.id}`), {
    userId: currentUserId,
    connectedUserId: viewedProfile.id,
    status: "accepted",
    connectedProfile: receiverSnap,
    method: "link",
    personalNote: "",
    tags: [],
    event: "",
    locationName: "",
    followUpSent: false,
    metAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    lastInteractionAt: serverTimestamp(),
    connectionType: viewedProfile.professionalMode === "dentist" ? "Dentist" : "Business",
    connectionStrength: 72,
    favorite: false,
  });

  batch.set(doc(db, "connections", `${viewedProfile.id}_${currentUserId}`), {
    userId: viewedProfile.id,
    connectedUserId: currentUserId,
    status: "accepted",
    connectedProfile: senderSnap,
    method: "link",
    personalNote: "",
    tags: [],
    event: "",
    locationName: "",
    followUpSent: false,
    metAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    lastInteractionAt: serverTimestamp(),
    connectionType: userProfile.professionalMode === "dentist" ? "Dentist" : "Business",
    connectionStrength: 72,
    favorite: false,
  });

  batch.set(doc(db, "users", currentUserId, "network", viewedProfile.id), {
    ...receiverSnap,
    userId: currentUserId,
    connectedUserId: viewedProfile.id,
    status: "accepted",
    method: "link",
    personalNote: "",
    tags: [],
    event: "",
    locationName: "",
    followUpSent: false,
    favorite: false,
    metAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    lastInteractionAt: serverTimestamp(),
    connectionStrength: 72,
  });

  batch.set(doc(db, "users", viewedProfile.id, "network", currentUserId), {
    ...senderSnap,
    userId: viewedProfile.id,
    connectedUserId: currentUserId,
    status: "accepted",
    method: "link",
    personalNote: "",
    tags: [],
    event: "",
    locationName: "",
    followUpSent: false,
    favorite: false,
    metAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    lastInteractionAt: serverTimestamp(),
    connectionStrength: 72,
  });

  await batch.commit();
}

export async function createConnection(data: {
  userId: string;
  connectedUserId: string;
  connectedProfile: Partial<VeloraProfile>;
  method: ConnectionMethod;
  contextLabel?: string;
  locationName?: string;
  introducedBy?: string;
  personalNote?: string;
}): Promise<string> {
  if (data.userId === data.connectedUserId) {
    throw new Error("Cannot connect to yourself");
  }
  const connectionId = `${data.userId}_${data.connectedUserId}`;
  await setDoc(doc(db, "connections", connectionId), {
    ...data,
    connectionType: data.connectedProfile.professionalMode === "dentist" ? "Dentist" : "Business",
    followUpSent: false,
    metAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    lastInteractionAt: serverTimestamp(),
    connectionStrength: 68,
    favorite: false,
  }, { merge: false });
  return connectionId;
}

export async function updateConnectionFollowUp(
  connectionId: string,
  followUpSent: boolean
): Promise<void> {
  await setDoc(doc(db, "connections", connectionId), { followUpSent }, { merge: true });
}

export async function updateConnectionNote(
  connectionId: string,
  personalNote: string
): Promise<void> {
  await setDoc(doc(db, "connections", connectionId), { personalNote }, { merge: true });
}

export async function getRelationshipStatus(
  currentUserId: string,
  targetUserId: string
): Promise<{
  status: "connected" | "pending_sent" | "pending_received" | "blocked" | "blocked_by" | "none";
  connectionId?: string;
  requestId?: string;
}> {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    return { status: "none" };
  }

  try {
    const blockRef = doc(db, "blocked_users", `${currentUserId}_${targetUserId}`);
    const blockSnap = await getDoc(blockRef);
    if (blockSnap.exists()) {
      return { status: "blocked" };
    }

    const blockedByRef = doc(db, "blocked_users", `${targetUserId}_${currentUserId}`);
    const blockedBySnap = await getDoc(blockedByRef);
    if (blockedBySnap.exists()) {
      return { status: "blocked_by" };
    }

    const connQuery = query(
      collection(db, "connections"),
      where("userId", "==", currentUserId),
      where("connectedUserId", "==", targetUserId),
      limit(1)
    );
    const connSnap = await getDocs(connQuery);
    if (!connSnap.empty) {
      return {
        status: "connected",
        connectionId: connSnap.docs[0].id,
      };
    }

    const reqSentRef = doc(db, "contact_requests", `${currentUserId}_${targetUserId}`);
    const reqSentSnap = await getDoc(reqSentRef);
    if (reqSentSnap.exists() && reqSentSnap.data().status === "pending") {
      return {
        status: "pending_sent",
        requestId: reqSentSnap.id,
      };
    }

    const reqRecvRef = doc(db, "contact_requests", `${targetUserId}_${currentUserId}`);
    const reqRecvSnap = await getDoc(reqRecvRef);
    if (reqRecvSnap.exists() && reqRecvSnap.data().status === "pending") {
      return {
        status: "pending_received",
        requestId: reqRecvSnap.id,
      };
    }

    return { status: "none" };
  } catch (error) {
    logger.error("Error in getRelationshipStatus:", error);
    return { status: "none" };
  }
}

export async function sendContactRequest(params: {
  senderId: string;
  receiverId: string;
  senderProfile: VeloraProfile;
  receiverProfile: VeloraProfile;
  method?: ConnectionMethod;
  event?: string;
  locationName?: string;
  personalNote?: string;
  tags?: string[];
}): Promise<void> {
  const {
    senderId,
    receiverId,
    senderProfile,
    receiverProfile,
    method = "link",
    event = "",
    locationName = "",
    personalNote = "",
    tags = [],
  } = params;

  if (!auth.currentUser) {
    throw new Error("Authentication required");
  }
  if (auth.currentUser.uid !== senderId) {
    throw new Error("Unauthorized sender ID");
  }

  if (senderId === receiverId) {
    throw new Error("Cannot connect to yourself");
  }

  const statusCheck = await getRelationshipStatus(senderId, receiverId);
  if (statusCheck.status === "blocked" || statusCheck.status === "blocked_by") {
    throw new Error("Unable to connect due to block status");
  }
  if (statusCheck.status === "connected") {
    throw new Error("Already connected with this user");
  }
  if (statusCheck.status === "pending_sent") {
    throw new Error("Contact request already pending");
  }
  if (statusCheck.status === "pending_received") {
    throw new Error("You have an incoming contact request from this user");
  }
  if (statusCheck.status !== "none") {
    throw new Error(`Cannot send contact request (status: ${statusCheck.status})`);
  }

  const requestRef = doc(db, "contact_requests", `${senderId}_${receiverId}`);
  await setDoc(requestRef, {
    senderId,
    receiverId,
    senderProfile: {
      id: senderProfile.id,
      fullName: senderProfile.fullName,
      avatarUrl: senderProfile.avatarUrl || null,
      title: senderProfile.title || null,
      company: senderProfile.company || null,
      professionalMode: senderProfile.professionalMode || "entrepreneur",
      username: senderProfile.username,
    },
    receiverProfile: {
      id: receiverProfile.id,
      fullName: receiverProfile.fullName,
      avatarUrl: receiverProfile.avatarUrl || null,
      title: receiverProfile.title || null,
      company: receiverProfile.company || null,
      professionalMode: receiverProfile.professionalMode || "entrepreneur",
      username: receiverProfile.username,
    },
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    method,
    event,
    locationName,
    personalNote,
    tags,
  });

  await addDoc(collection(db, "notifications"), {
    userId: receiverId,
    senderId,
    senderName: senderProfile.fullName,
    senderAvatar: senderProfile.avatarUrl || null,
    type: "contact_request",
    text: `${senderProfile.fullName} souhaite s'ajouter à votre réseau.`,
    read: false,
    createdAt: serverTimestamp(),
  });

  try {
    await sendPushNotification({
      toUid: receiverId,
      title: "Nouveau contact",
      body: `${senderProfile.fullName} souhaite se connecter avec vous sur Velora`,
      data: {
        type: "contact_request",
        senderId,
      },
    });
  } catch (err) {
    logger.error("Failed to send push notification for contact request:", err);
  }
}

export async function cancelContactRequest(senderId: string, receiverId: string): Promise<void> {
  const requestRef = doc(db, "contact_requests", `${senderId}_${receiverId}`);
  await deleteDoc(requestRef);
}

export async function acceptContactRequest(
  senderId: string,
  receiverId: string,
  senderProfile: VeloraProfile,
  receiverProfile: VeloraProfile
): Promise<void> {
  const requestRef = doc(db, "contact_requests", `${senderId}_${receiverId}`);
  const requestSnap = await getDoc(requestRef);
  const requestData = requestSnap.exists() ? requestSnap.data() : {};

  const method = asString(requestData.method, "link") as ConnectionMethod;
  const personalNote = asString(requestData.personalNote);
  const tags = Array.isArray(requestData.tags) ? requestData.tags.map(t => String(t)) : [];
  const event = asString(requestData.event);
  const locationName = asString(requestData.locationName);

  logger.info(
    `[Network:accept] senderId=${senderId} receiverId=${receiverId} method=${method}`
  );

  await setDoc(requestRef, { status: "accepted", updatedAt: serverTimestamp() }, { merge: true });

  const receiverSnap = {
    id: receiverProfile.id,
    fullName: receiverProfile.fullName,
    avatarUrl: receiverProfile.avatarUrl || null,
    title: receiverProfile.title || null,
    company: receiverProfile.company || null,
    professionalMode: receiverProfile.professionalMode || "entrepreneur",
    username: receiverProfile.username,
  };
  const senderSnap = {
    id: senderProfile.id,
    fullName: senderProfile.fullName,
    avatarUrl: senderProfile.avatarUrl || null,
    title: senderProfile.title || null,
    company: senderProfile.company || null,
    professionalMode: senderProfile.professionalMode || "entrepreneur",
    username: senderProfile.username,
  };

  const batch = writeBatch(db);

  batch.set(doc(db, "connections", `${senderId}_${receiverId}`), {
    userId: senderId,
    connectedUserId: receiverId,
    status: "accepted",
    connectedProfile: receiverSnap,
    method,
    personalNote,
    tags,
    event,
    locationName,
    followUpSent: false,
    metAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    lastInteractionAt: serverTimestamp(),
    connectionType: receiverProfile.professionalMode === "dentist" ? "Dentist" : "Business",
    connectionStrength: 72,
    favorite: false,
  });

  batch.set(doc(db, "connections", `${receiverId}_${senderId}`), {
    userId: receiverId,
    connectedUserId: senderId,
    status: "accepted",
    connectedProfile: senderSnap,
    method,
    personalNote,
    tags,
    event,
    locationName,
    followUpSent: false,
    metAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    lastInteractionAt: serverTimestamp(),
    connectionType: senderProfile.professionalMode === "dentist" ? "Dentist" : "Business",
    connectionStrength: 72,
    favorite: false,
  });

  batch.set(doc(db, "users", senderId, "network", receiverId), {
    ...receiverSnap,
    userId: senderId,
    connectedUserId: receiverId,
    status: "accepted",
    method,
    personalNote,
    tags,
    event,
    locationName,
    followUpSent: false,
    favorite: false,
    metAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    lastInteractionAt: serverTimestamp(),
    connectionStrength: 72,
  });

  batch.set(doc(db, "users", receiverId, "network", senderId), {
    ...senderSnap,
    userId: receiverId,
    connectedUserId: senderId,
    status: "accepted",
    method,
    personalNote,
    tags,
    event,
    locationName,
    followUpSent: false,
    favorite: false,
    metAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    lastInteractionAt: serverTimestamp(),
    connectionStrength: 72,
  });

  await batch.commit();

  await addDoc(collection(db, "notifications"), {
    userId: senderId,
    senderId: receiverId,
    senderName: receiverProfile.fullName,
    senderAvatar: receiverProfile.avatarUrl || null,
    type: "contact_accepted",
    text: `${receiverProfile.fullName} a accepté votre demande de connexion.`,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function declineContactRequest(senderId: string, receiverId: string): Promise<void> {
  const requestRef = doc(db, "contact_requests", `${senderId}_${receiverId}`);
  await deleteDoc(requestRef);
}

export async function removeConnection(currentUserId: string, targetUserId: string): Promise<void> {
  const q1 = query(
    collection(db, "connections"),
    where("userId", "==", currentUserId),
    where("connectedUserId", "==", targetUserId)
  );
  const q2 = query(
    collection(db, "connections"),
    where("userId", "==", targetUserId),
    where("connectedUserId", "==", currentUserId)
  );

  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  const deletePromises: Promise<void>[] = [];

  snap1.forEach((doc) => deletePromises.push(deleteDoc(doc.ref)));
  snap2.forEach((doc) => deletePromises.push(deleteDoc(doc.ref)));

  const req1Ref = doc(db, "contact_requests", `${currentUserId}_${targetUserId}`);
  const req2Ref = doc(db, "contact_requests", `${targetUserId}_${currentUserId}`);
  deletePromises.push(deleteDoc(req1Ref));
  deletePromises.push(deleteDoc(req2Ref));

  deletePromises.push(deleteDoc(doc(db, "users", currentUserId, "network", targetUserId)));
  deletePromises.push(deleteDoc(doc(db, "users", targetUserId, "network", currentUserId)));

  await Promise.all(deletePromises);
}

export async function updateConnectionNotesAndTags(
  currentUserId: string,
  targetUserId: string,
  notes: string,
  tags: string[]
): Promise<void> {
  const q = query(
    collection(db, "connections"),
    where("userId", "==", currentUserId),
    where("connectedUserId", "==", targetUserId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    await setDoc(snap.docs[0].ref, {
      personalNote: notes,
      tags: tags,
    }, { merge: true });
  }

  const subDocRef = doc(db, "users", currentUserId, "network", targetUserId);
  const subDocSnap = await getDoc(subDocRef);
  if (subDocSnap.exists()) {
    await setDoc(subDocRef, {
      personalNote: notes,
      tags: tags,
    }, { merge: true });
  }
}

export async function updateConnectionFavorite(
  currentUserId: string,
  targetUserId: string,
  favorite: boolean
): Promise<void> {
  const q = query(
    collection(db, "connections"),
    where("userId", "==", currentUserId),
    where("connectedUserId", "==", targetUserId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    await setDoc(snap.docs[0].ref, {
      favorite,
      isFavorite: favorite,
      lastInteractionAt: serverTimestamp(),
    }, { merge: true });
  }

  const subDocRef = doc(db, "users", currentUserId, "network", targetUserId);
  const subDocSnap = await getDoc(subDocRef);
  if (subDocSnap.exists()) {
    await setDoc(subDocRef, {
      favorite,
      isFavorite: favorite,
      lastInteractionAt: serverTimestamp(),
    }, { merge: true });
  }
}

export async function blockUser(userId: string, blockedUserId: string): Promise<void> {
  const blockRef = doc(db, "blocked_users", `${userId}_${blockedUserId}`);
  await setDoc(blockRef, {
    userId,
    blockedUserId,
    createdAt: serverTimestamp(),
  });

  await removeConnection(userId, blockedUserId);
}

export async function unblockUser(userId: string, blockedUserId: string): Promise<void> {
  const blockRef = doc(db, "blocked_users", `${userId}_${blockedUserId}`);
  await deleteDoc(blockRef);
}

export function onPendingRequestsChange(
  userId: string,
  type: "incoming" | "outgoing",
  callback: (requests: ContactRequest[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const fieldName = type === "incoming" ? "receiverId" : "senderId";
  const q = query(
    collection(db, "contact_requests").withConverter(contactRequestConverter),
    where(fieldName, "==", userId),
    where("status", "==", "pending")
  );

  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((doc) => doc.data()));
  }, (error) => {
    logger.error(`[Firestore Error] Pending requests listener failed for: ${userId}`, error);
    onError?.(error);
  });
}

export async function getMutualConnections(userId1: string, userId2: string): Promise<string[]> {
  if (!userId1 || !userId2) return [];
  try {
    const q1 = query(collection(db, "connections"), where("userId", "==", userId1));
    const q2 = query(collection(db, "connections"), where("userId", "==", userId2));

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const set1 = new Set(snap1.docs.map((d) => d.data().connectedUserId));
    const set2 = new Set(snap2.docs.map((d) => d.data().connectedUserId));

    return Array.from(set1).filter((uid) => set2.has(uid)) as string[];
  } catch (err) {
    logger.error("Error in getMutualConnections:", err);
    return [];
  }
}

export async function getNetworkingSuggestions(
  currentUserId: string,
  professionalMode: string,
  limitCount = 5
): Promise<VeloraProfile[]> {
  try {
    const connSnap = await getDocs(query(
      collection(db, "connections"),
      where("userId", "==", currentUserId)
    ));
    const connectedUserIds = new Set(connSnap.docs.map((doc) => doc.data().connectedUserId));
    connectedUserIds.add(currentUserId);

    const modeQuery = query(
      collection(db, "users"),
      where("professionalMode", "==", professionalMode),
      limit(50)
    );

    const modeSnap = await getDocs(modeQuery);
    const suggestions: VeloraProfile[] = [];

    modeSnap.forEach((doc) => {
      const profile = normalizeProfile(doc.id, doc.data());
      const isDemo = profile.isDemo || 
                     profile.email?.endsWith("@demo.com") || 
                     profile.email?.endsWith("@example.com") || 
                     profile.username.toLowerCase().includes("demo") || 
                     profile.fullName.toLowerCase().includes("demo") || 
                     profile.fullName.toLowerCase().includes("test");
                     
      if (!connectedUserIds.has(profile.id) && !isDemo && profile.ghostMode !== true && profile.isVisible !== false) {
        suggestions.push(profile);
      }
    });

    if (suggestions.length < limitCount) {
      const fallbackModes = ["entrepreneur", "business", "creator"];
      for (const mode of fallbackModes) {
        if (mode === professionalMode) continue;
        if (suggestions.length >= limitCount) break;

        const fallbackQuery = query(
          collection(db, "users"),
          where("professionalMode", "==", mode),
          limit(20)
        );
        const fallbackSnap = await getDocs(fallbackQuery);
        fallbackSnap.forEach((doc) => {
          const profile = normalizeProfile(doc.id, doc.data());
          const isDemo = profile.isDemo || 
                         profile.email?.endsWith("@demo.com") || 
                         profile.email?.endsWith("@example.com") || 
                         profile.username.toLowerCase().includes("demo") || 
                         profile.fullName.toLowerCase().includes("demo") || 
                         profile.fullName.toLowerCase().includes("test");

          if (!connectedUserIds.has(profile.id) && !isDemo && !suggestions.some((s) => s.id === profile.id) && profile.ghostMode !== true && profile.isVisible !== false) {
            suggestions.push(profile);
          }
        });
      }
    }

    return suggestions.slice(0, limitCount);
  } catch (err) {
    logger.error("Error in getNetworkingSuggestions:", err);
    return [];
  }
}
