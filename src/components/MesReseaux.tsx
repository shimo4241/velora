"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { UserCheck, Search, Sparkles, Loader2, User } from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface NetworkContact {
  uid: string;
  name: string;
  avatar: string;
  headline: string;
  connectedAt?: any;
}

export default function MesReseaux() {
  const router = useRouter();
  const { user, isAuthReady } = useAuth();
  
  const [contacts, setContacts] = useState<NetworkContact[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user) {
      setLoading(false);
      setError("Veuillez vous connecter pour voir vos connexions.");
      return;
    }

    setLoading(true);
    setError(null);

    const networkRef = collection(db, "users", user.uid, "network");
    const q = query(networkRef, orderBy("connectedAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: NetworkContact[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          list.push({
            uid: doc.id,
            name: data.name || "",
            avatar: data.avatar || "",
            headline: data.headline || "",
            connectedAt: data.connectedAt,
          });
        });
        setContacts(list);
        setLoading(false);
      },
      (err) => {
        console.error("[MesReseaux:onSnapshot] failed:", err);
        setError("Impossible de charger votre réseau.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user, isAuthReady]);

  // Filter connections by name or headline
  const filteredContacts = contacts.filter((contact) => {
    const search = searchQuery.toLowerCase().trim();
    if (!search) return true;
    return (
      contact.name.toLowerCase().includes(search) ||
      contact.headline.toLowerCase().includes(search)
    );
  });

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6">
      {/* Header section */}
      <div className="mb-6 flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-tight text-velora-text flex items-center gap-2">
          Mon Réseau
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-velora-gold/10 text-velora-gold font-medium border border-velora-gold/20">
            {contacts.length} {contacts.length > 1 ? "membres" : "membre"}
          </span>
        </h2>
        <p className="text-xs text-velora-text-muted">
          Retrouvez et échangez avec vos relations professionnelles connectées.
        </p>
      </div>

      {/* Search Bar */}
      {contacts.length > 0 && (
        <div className="relative mb-6">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-velora-text-muted pointer-events-none">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Rechercher par nom ou titre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-velora-text placeholder-velora-text-muted focus:outline-none focus:border-velora-gold/30 transition-colors"
          />
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="animate-spin text-velora-gold" size={24} />
          <p className="text-xs text-velora-text-muted">Chargement de votre réseau...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-center">
          <p className="text-sm text-red-400 font-medium">{error}</p>
        </div>
      ) : contacts.length === 0 ? (
        <div className="relative overflow-hidden rounded-[24px] border border-white/5 bg-white/[0.02] p-8 text-center backdrop-blur-md">
          <div className="mx-auto w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-velora-gold/60 mb-4">
            <Sparkles size={20} />
          </div>
          <h3 className="text-sm font-semibold text-velora-text mb-1">Votre réseau est vide</h3>
          <p className="text-xs text-velora-text-muted max-w-[280px] mx-auto mb-5 leading-relaxed">
            Commencez à ajouter des connexions en scannant des cartes NFC, des codes QR, ou via des liens de profils.
          </p>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-velora-text-muted">Aucun résultat trouvé pour "{searchQuery}".</p>
        </div>
      ) : (
        <motion.div
          layout
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredContacts.map((contact, index) => (
              <motion.div
                key={contact.uid}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                onClick={() => router.push(`/p/${contact.uid}`)}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 hover:border-velora-gold/30 hover:bg-white/[0.04] transition-all cursor-pointer flex items-center justify-between shadow-md"
              >
                {/* Contact Preview Info */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 flex-shrink-0 bg-black/40">
                    {contact.avatar ? (
                      <OptimizedImage
                        src={contact.avatar}
                        type="avatar"
                        alt={contact.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center text-velora-gold text-sm font-bold uppercase">
                        <User size={18} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-velora-text truncate group-hover:text-velora-gold transition-colors">
                      {contact.name}
                    </h4>
                    {contact.headline && (
                      <p className="text-xs text-velora-text-muted truncate mt-0.5 leading-normal">
                        {contact.headline}
                      </p>
                    )}
                  </div>
                </div>

                {/* Badge Connecté */}
                <div className="flex-shrink-0 ml-4">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-velora-gold bg-velora-gold/10 px-2.5 py-1 rounded-full border border-velora-gold/20 shadow-sm shadow-black/10">
                    <UserCheck size={10} />
                    Connecté
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
