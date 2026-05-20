"use client";

import { useState, useCallback, useEffect } from "react";
import { Divider } from "@/components/ui";
import { FadeUp, StaggerChildren, StaggerItem } from "@/components/motion/animations";
import { RadarDiscovery, NearbyList } from "@/components/network";
import { EmptyState } from "@/components/ui/States";
import { useTranslation } from "@/lib/i18n";
import { useProfile } from "@/hooks/useProfile";
import { useConnections } from "@/hooks/useConnections";
import { 
  Radar, 
  BookOpen, 
  Search, 
  X, 
  Phone, 
  MessageSquare, 
  Mail, 
  Sparkles, 
  Shield, 
  Star, 
  Calendar, 
  MapPin, 
  StickyNote, 
  CheckCircle, 
  Clock, 
  Edit3, 
  Trash2,
  ExternalLink,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui";
import { 
  removeConnection, 
  updateConnectionNotesAndTags, 
  blockUser 
} from "@/lib/firestore";
import type { VeloraConnection } from "@/types";

/* ═══════════════════════════════════════════════════
   VELORA — Discover Screen
   Nearby discovery + Scan Memory (connection history)
   ═══════════════════════════════════════════════════ */

type DiscoverTab = "nearby" | "memory";

export function NetworkScreen() {
  const [tab, setTab] = useState<DiscoverTab>("nearby");
  const [nearbyCount, setNearbyCount] = useState(0);
  const { profile, isProfileReady } = useProfile();
  const { t } = useTranslation(profile?.locale || "fr");

  const handleNearbyCount = useCallback((n: number) => setNearbyCount(n), []);

  if (!isProfileReady || !profile) return null;

  return (
    <div className="min-h-screen bg-velora-black safe-bottom">
      {/* Header */}
      <div className="px-5 pt-14 pb-2">
        <FadeUp>
          <div className="text-center">
            <div className="text-caption text-velora-gold mb-1">
              {t("nav_discover")}
            </div>
            <h1 className="text-display text-2xl text-velora-text">
              Networking
            </h1>
          </div>
        </FadeUp>
      </div>

      {/* Tab toggle */}
      <div className="section">
        <FadeUp delay={0.1}>
          <div className="flex gap-1 p-1 rounded-[var(--radius-sm)] glass">
            {[
              { id: "nearby" as const, label: "Nearby", icon: Radar },
              { id: "memory" as const, label: t("scan_memory"), icon: BookOpen },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                    tab === item.id
                      ? "bg-velora-gold-dim text-velora-gold"
                      : "text-velora-text-muted"
                  }`}
                >
                  <Icon size={14} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </FadeUp>
      </div>

      {/* Content */}
      {tab === "nearby" ? (
        <>
          <RadarDiscovery count={nearbyCount} />
          <Divider className="mx-5" />
          <div className="px-5 pt-5 pb-2">
            <FadeUp delay={0.6}>
              <div className="flex items-center justify-between">
                <h2 className="text-heading text-base text-velora-text">
                  Nearby Professionals
                </h2>
                <span className="text-caption text-velora-gold">
                  {nearbyCount > 0 ? `${nearbyCount} found` : "Searching..."}
                </span>
              </div>
            </FadeUp>
          </div>
          <NearbyList onCountChange={handleNearbyCount} />
        </>
      ) : (
        <ScanMemoryList />
      )}
    </div>
  );
}

const METHOD_CONFIG = {
  nfc: {
    icon: Sparkles,
    label: "NFC Tap",
    color: "text-velora-gold",
    bg: "bg-velora-gold/10",
  },
  qr: {
    icon: BookOpen,
    label: "QR Scan",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  whatsapp: {
    icon: MessageSquare,
    label: "WhatsApp",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  link: {
    icon: ExternalLink,
    label: "Link",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  nearby: {
    icon: MapPin,
    label: "Nearby",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
} as const;

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Recently";
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function ScanMemoryList() {
  const { profile } = useProfile();
  const { connections, count, loading } = useConnections();
  const { t } = useTranslation(profile?.locale || "fr");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [editingConnection, setEditingConnection] = useState<VeloraConnection | null>(null);
  
  // Modal states
  const [notes, setNotes] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);

  // Sync modal inputs with editing connection
  useEffect(() => {
    if (editingConnection) {
      setNotes(editingConnection.personalNote || "");
      setSelectedTags(editingConnection.tags || []);
    }
  }, [editingConnection]);

  if (!profile) return null;

  // Filter connections
  const filteredConnections = connections.filter((conn) => {
    const cp = conn.profile;
    const nameMatch = (cp?.fullName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const titleMatch = (cp?.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    const companyMatch = (cp?.company || "").toLowerCase().includes(searchQuery.toLowerCase());
    const searchMatch = nameMatch || titleMatch || companyMatch;

    if (selectedTag === "All") {
      return searchMatch;
    }
    return searchMatch && conn.tags?.includes(selectedTag);
  });

  const handleUpdate = async () => {
    if (!editingConnection) return;
    setUpdating(true);
    try {
      await updateConnectionNotesAndTags(
        profile.id,
        editingConnection.profile.id,
        notes,
        selectedTags
      );
      setEditingConnection(null);
    } catch (err) {
      console.error("Error updating connection:", err);
      alert("Failed to update connection details.");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (!editingConnection) return;
    if (!window.confirm(t("confirm_delete_connection") || "Delete this connection?")) return;
    setUpdating(true);
    try {
      await removeConnection(profile.id, editingConnection.profile.id);
      setEditingConnection(null);
    } catch (err) {
      console.error("Error removing connection:", err);
      alert("Failed to remove connection.");
    } finally {
      setUpdating(false);
    }
  };

  const handleBlock = async () => {
    if (!editingConnection) return;
    if (!window.confirm(t("confirm_block_connection") || "Block this user?")) return;
    setUpdating(true);
    try {
      await blockUser(profile.id, editingConnection.profile.id);
      setEditingConnection(null);
    } catch (err) {
      console.error("Error blocking user:", err);
      alert("Failed to block user.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <FadeUp delay={0.2}>
          <div className="flex items-center justify-between">
            <h2 className="text-heading text-base text-velora-text">
              {t("your_connections")}
            </h2>
            <span className="text-caption text-velora-gold">
              {count}
            </span>
          </div>
        </FadeUp>
      </div>

      {/* Search Bar */}
      <div className="px-5 py-2">
        <FadeUp delay={0.25}>
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-4 text-velora-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("search_network_placeholder") || "Rechercher par nom, titre..."}
              className="w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-10 py-3 text-sm text-velora-text placeholder-white/20 focus:border-velora-gold/40 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-velora-text-muted hover:bg-white/10"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </FadeUp>
      </div>

      {/* Tag Filters */}
      <div className="px-5 py-2 overflow-x-auto scrollbar-none">
        <FadeUp delay={0.3}>
          <div className="flex gap-2 pb-1" style={{ minWidth: "max-content" }}>
            {["All", "Business", "Dentist", "Client", "VIP", "Friend", "Partner"].map((tag) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide border transition-all ${
                    isSelected
                      ? "border-velora-gold bg-velora-gold/10 text-velora-gold"
                      : "border-white/5 bg-white/[0.02] text-velora-text-muted hover:border-white/10 hover:text-velora-text"
                  }`}
                >
                  {tag === "All" ? t("filter_all") || "All" : t(`filter_${tag.toLowerCase()}`) || tag}
                </button>
              );
            })}
          </div>
        </FadeUp>
      </div>

      {/* Connections List */}
      <div className="px-5 py-4 pb-20">
        {loading ? (
          <div className="py-8 text-center text-sm text-velora-text-muted">
            Chargement...
          </div>
        ) : filteredConnections.length > 0 ? (
          <StaggerChildren staggerDelay={0.08} delay={0.35} className="space-y-3">
            {filteredConnections.map((conn) => {
              const cp = conn.profile;
              const initials = (cp?.fullName || "V")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2);

              const method = METHOD_CONFIG[conn.method] || METHOD_CONFIG.nfc;
              const MethodIcon = method.icon;

              return (
                <StaggerItem key={conn.id}>
                  <GlassCard className="p-4 relative overflow-hidden group">
                    <div className="flex items-start gap-3.5">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-velora-gold/20 to-amber-900/10 flex items-center justify-center border border-white/5">
                          <span className="text-base font-bold text-velora-gold font-[family-name:var(--font-display)]">
                            {initials}
                          </span>
                        </div>
                        {cp?.isVerified && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-velora-black flex items-center justify-center border border-velora-gold/30">
                            <Shield size={10} className="text-velora-gold" fill="currentColor" />
                          </div>
                        )}
                      </div>

                      {/* Professional Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-semibold text-velora-text truncate font-[family-name:var(--font-display)]">
                            {cp?.fullName || "Unknown"}
                          </h3>
                          {cp?.isPremium && (
                            <Star size={11} className="text-velora-gold flex-shrink-0" fill="currentColor" />
                          )}
                        </div>
                        <div className="text-xs text-velora-text-secondary mt-0.5 truncate">
                          {cp?.title || "Professional"}
                          {cp?.company && ` · ${cp.company}`}
                        </div>
                      </div>

                      {/* Method Badge */}
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${method.bg} flex-shrink-0`}>
                        <MethodIcon size={10} className={method.color} />
                        <span className={`text-[9px] font-semibold uppercase tracking-wider ${method.color}`}>
                          {method.label}
                        </span>
                      </div>
                    </div>

                    {/* Metadata & Tags */}
                    <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1 text-[10px] text-velora-text-muted">
                        <MapPin size={10} className="text-velora-gold/50" />
                        <span>{conn.contextLabel || "Global"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-velora-text-muted">
                        <Calendar size={10} className="text-velora-gold/50" />
                        <span>{formatRelativeDate(conn.metAt)}</span>
                      </div>
                      
                      {/* Connection tags */}
                      {conn.tags && conn.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 ml-auto">
                          {conn.tags.map((tag) => (
                            <span 
                              key={tag}
                              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-velora-text-muted border border-white/5"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Personal Notes */}
                    {conn.personalNote && (
                      <div className="mt-2.5 flex items-start gap-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                        <StickyNote size={10} className="text-velora-gold/60 mt-0.5 flex-shrink-0" />
                        <p className="text-[10px] text-velora-text-muted leading-normal">
                          {conn.personalNote}
                        </p>
                      </div>
                    )}

                    {/* Quick Actions Tray */}
                    <div className="flex items-center gap-2 mt-3.5 pt-3.5 border-t border-white/5 justify-end">
                      {cp?.phone && (
                        <a 
                          href={`tel:${cp.phone}`}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-velora-text-muted hover:bg-white/10 hover:text-velora-text transition-colors"
                        >
                          <Phone size={13} />
                        </a>
                      )}
                      {cp?.whatsapp && (
                        <a 
                          href={`https://wa.me/${cp.whatsapp}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-velora-text-muted hover:bg-white/10 hover:text-velora-text transition-colors"
                        >
                          <MessageSquare size={13} />
                        </a>
                      )}
                      {cp?.email && (
                        <a 
                          href={`mailto:${cp.email}`}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-velora-text-muted hover:bg-white/10 hover:text-velora-text transition-colors"
                        >
                          <Mail size={13} />
                        </a>
                      )}
                      
                      <span className="h-4 w-px bg-white/10 mx-1" />

                      {cp?.username && (
                        <a 
                          href={`/u/${cp.username}`}
                          className="flex h-8 px-3 items-center gap-1.5 rounded-xl bg-white/5 text-xs text-velora-text-muted hover:bg-white/10 hover:text-velora-text transition-colors"
                        >
                          <ExternalLink size={12} />
                          <span>{t("view_profile") || "Profil"}</span>
                        </a>
                      )}

                      <button 
                        onClick={() => setEditingConnection(conn)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-velora-gold/10 text-velora-gold hover:bg-velora-gold/20 transition-colors"
                      >
                        <Edit3 size={13} />
                      </button>
                    </div>
                  </GlassCard>
                </StaggerItem>
              );
            })}
          </StaggerChildren>
        ) : (
          <EmptyState
            title={t("empty_network_title") || "Aucune connexion"}
            description={t("empty_network_desc") || "Scannez un QR code ou partagez votre profil pour commencer."}
          />
        )}
      </div>

      {/* Edit Details Modal */}
      <AnimatePresence>
        {editingConnection && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 md:items-center md:p-4">
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingConnection(null)}
            />
            <motion.div
              className="relative z-10 w-full rounded-t-[32px] border border-white/10 bg-[#0c0c0a] p-6 shadow-2xl md:max-w-md md:rounded-[32px] overflow-hidden"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
            >
              <div className="glow-layer pointer-events-none absolute inset-x-8 -top-16 h-36 rounded-full bg-velora-gold/5 blur-xl" />
              
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-velora-text">
                  {t("edit_connection_title") || "Modifier la connexion"}
                </h3>
                <button
                  onClick={() => setEditingConnection(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-velora-text-muted hover:bg-white/10"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-velora-text-muted mb-1.5">
                    {t("notes") || "Notes"}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("add_note_placeholder") || "Ajouter des notes..."}
                    rows={3}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-velora-text placeholder-white/20 focus:border-velora-gold/40 focus:outline-none"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-velora-text-muted mb-1.5">
                    {t("tags") || "Tags"}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Business", "Dentist", "Client", "VIP", "Friend", "Partner"].map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setSelectedTags(prev => 
                              prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                            );
                          }}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                            isSelected 
                              ? "border-velora-gold bg-velora-gold/10 text-velora-gold" 
                              : "border-white/10 bg-white/5 text-velora-text hover:border-white/20"
                          }`}
                        >
                          {t(`filter_${tag.toLowerCase()}`) || tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Block / Remove buttons */}
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={handleBlock}
                    disabled={updating}
                    className="text-xs text-red-500 hover:text-red-400 font-medium text-left transition-colors"
                  >
                    {t("block_user") || "Bloquer cet utilisateur"}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-2">
                <div className="flex gap-3">
                  <button
                    onClick={handleRemove}
                    disabled={updating}
                    className="flex-1 rounded-2xl border border-red-500/20 bg-red-500/5 py-3.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    {t("remove_connection") || "Supprimer"}
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    style={{
                      background: `linear-gradient(135deg, #c9a84c, #a78229)`
                    }}
                    className="flex-1 rounded-2xl py-3.5 text-sm font-semibold text-velora-black shadow-lg shadow-velora-gold/20 hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                  >
                    {updating ? <span className="animate-spin text-velora-black">●</span> : t("save") || "Enregistrer"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
