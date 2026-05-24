"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { BookOpen, Filter, MapPin, Radar, Search, Sparkles, Star, Users, X } from "lucide-react";
import { EmptyState } from "@/components/ui/States";
import { FadeUp } from "@/components/motion/animations";
import { NearbyList, RadarDiscovery } from "@/components/network";
import { NetworkContactCard } from "@/components/network/NetworkContactCard";
import { useConnections } from "@/hooks/useConnections";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useProfile } from "@/hooks/useProfile";
import { updateConnectionFavorite, updateConnectionNotesAndTags } from "@/lib/firestore";
import type { VeloraConnection } from "@/types";

type NetworkTab = "all" | "favorites" | "recent" | "nearby";
type TopFilter = "all" | "dentist" | "business" | "vip" | "creator" | "nearby";

const TABS: Array<{ id: NetworkTab; label: string; icon: typeof Users }> = [
  { id: "all", label: "Tous", icon: Users },
  { id: "favorites", label: "Favoris", icon: Star },
  { id: "recent", label: "Recents", icon: BookOpen },
  { id: "nearby", label: "Proches", icon: Radar },
];

const FILTERS: Array<{ id: TopFilter; label: string }> = [
  { id: "all", label: "Tous" },
  { id: "dentist", label: "Dentistes" },
  { id: "business", label: "Business" },
  { id: "vip", label: "VIP" },
  { id: "creator", label: "Createurs" },
  { id: "nearby", label: "Nearby" },
];

function matchesFilter(connection: VeloraConnection, filter: TopFilter) {
  if (filter === "all") return true;
  if (filter === "nearby") return typeof connection.distance === "number" || connection.method === "nearby";
  if (filter === "dentist") return connection.profile.professionalMode === "dentist" || connection.connectionType === "Dentist";
  if (filter === "business") return connection.profile.professionalMode === "business" || connection.connectionType === "Business";
  if (filter === "vip") return connection.profile.professionalMode === "vip" || connection.connectionType === "VIP";
  if (filter === "creator") return connection.profile.professionalMode === "creator";
  return true;
}

function matchesTab(connection: VeloraConnection, tab: NetworkTab) {
  if (tab === "favorites") return Boolean(connection.favorite || connection.isFavorite);
  if (tab === "nearby") return typeof connection.distance === "number" || connection.method === "nearby";
  if (tab === "recent") {
    const time = new Date(connection.lastInteractionAt || connection.metAt).getTime();
    return Number.isFinite(time) && Date.now() - time < 1000 * 60 * 60 * 24 * 30;
  }
  return true;
}

function enrichConnection(connection: VeloraConnection, index: number): VeloraConnection {
  return {
    ...connection,
    distance: connection.distance ?? (index % 4 === 0 ? 90 : index % 3 === 0 ? 320 : index % 2 === 0 ? 2100 : undefined),
    mutualConnections: connection.mutualConnections ?? (connection.profile.isPremium ? 3 : index % 3),
    connectionStrength: connection.connectionStrength ?? Math.min(96, 58 + ((index + 1) * 7) % 38),
    favorite: connection.favorite ?? connection.isFavorite,
  };
}

export function NetworkScreen() {
  const { profile, isProfileReady } = useProfile();
  const { connections, loading } = useConnections();
  const geo = useGeolocation();
  const [tab, setTab] = useState<NetworkTab>("all");
  const [filter, setFilter] = useState<TopFilter>("all");
  const [query, setQuery] = useState("");
  const [nearbyCount, setNearbyCount] = useState(0);
  const [editing, setEditing] = useState<VeloraConnection | null>(null);
  const [draftNotes, setDraftNotes] = useState("");
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const network = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return connections
      .map(enrichConnection)
      .filter((connection) => matchesTab(connection, tab))
      .filter((connection) => matchesFilter(connection, filter))
      .filter((connection) => {
        if (!needle) return true;
        const profileText = [
          connection.profile.fullName,
          connection.profile.title,
          connection.profile.company,
          connection.profile.clinicName,
          ...(connection.tags || []),
        ].join(" ").toLowerCase();
        return profileText.includes(needle);
      });
  }, [connections, filter, query, tab]);

  if (!isProfileReady || !profile) return null;

  const openEditor = (connection: VeloraConnection) => {
    setEditing(connection);
    setDraftNotes(connection.notes || connection.personalNote || "");
    setDraftTags(connection.tags || []);
  };

  const toggleTag = (tag: string) => {
    setDraftTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  };

  const saveEditor = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await updateConnectionNotesAndTags(profile.id, editing.profile.id, draftNotes, draftTags);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const toggleFavorite = async (connection: VeloraConnection) => {
    await updateConnectionFavorite(profile.id, connection.profile.id, !(connection.favorite || connection.isFavorite));
  };

  return (
    <div className="min-h-screen bg-velora-black pb-24 text-velora-text">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[360px] bg-[radial-gradient(circle_at_50%_0%,var(--color-velora-gold-muted),transparent_58%)]" />

      <header className="relative px-5 pt-14">
        <FadeUp>
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-velora-gold/20 bg-velora-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-velora-gold">
                <Sparkles size={12} />
                Mon reseau
              </div>
              <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold leading-none">
                Relations premium
              </h1>
            </div>
            <div className="rounded-2xl border border-white/10 bg-velora-dark px-3 py-2 text-right">
              <div className="font-mono text-xl font-semibold text-velora-gold">{connections.length}</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-velora-text-muted">contacts</div>
            </div>
          </div>
        </FadeUp>
      </header>

      <section className="relative px-5 pt-5">
        <div className="grid grid-cols-4 gap-1 rounded-2xl border border-white/10 bg-velora-dark p-1">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex h-11 items-center justify-center gap-1.5 rounded-xl text-[11px] font-semibold transition ${
                  active ? "bg-velora-gold/15 text-velora-gold" : "text-velora-text-muted"
                }`}
              >
                <Icon size={13} />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="relative px-5 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                filter === item.id
                  ? "border-velora-gold/35 bg-velora-gold/12 text-velora-gold"
                  : "border-white/10 bg-white/[0.035] text-velora-text-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="relative px-5 pt-4">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-velora-text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un contact, cabinet, tag..."
            className="h-12 w-full rounded-2xl border border-white/10 bg-velora-dark pl-11 pr-10 text-sm text-velora-text outline-none placeholder:text-velora-text-muted/60 focus:border-velora-gold/30"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/8 text-velora-text-muted">
              <X size={13} />
            </button>
          )}
        </div>
      </section>

      <section className="relative px-5 pt-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-velora-dark p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-velora-text-muted">
              <MapPin size={13} className="text-velora-gold" />
              Proximite
            </div>
            <p className="mt-2 text-sm text-velora-text-secondary">
              {geo.permissionState === "denied" ? "Permission refusee" : geo.isSharing ? "Visible autour de vous" : "Mode prive actif"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => geo.toggleLocationSharing(!geo.isSharing)}
            className="rounded-2xl border border-velora-gold/20 bg-velora-gold/10 p-4 text-left text-sm font-semibold text-velora-gold"
          >
            {geo.isSharing ? "Masquer ma position" : "Activer nearby"}
          </button>
          <button
            type="button"
            onClick={() => geo.toggleGhostMode(!geo.ghostMode)}
            className="rounded-2xl border border-white/10 bg-velora-dark p-4 text-left text-sm font-semibold text-velora-text-secondary"
          >
            {geo.ghostMode ? "Quitter Ghost Mode" : "Invisible / Ghost Mode"}
          </button>
        </div>
      </section>

      {tab === "nearby" && (
        <section className="relative">
          <RadarDiscovery count={nearbyCount} />
          <NearbyList onCountChange={setNearbyCount} />
        </section>
      )}

      <main className="relative px-5 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-velora-text-muted">
            <Filter size={13} className="text-velora-gold" />
            {network.length} resultat{network.length > 1 ? "s" : ""}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-36 rounded-[24px] border border-white/10 bg-white/[0.045] premium-skeleton" />
            ))}
          </div>
        ) : network.length > 0 ? (
          <motion.div layout className="space-y-3">
            <AnimatePresence initial={false}>
              {network.map((connection) => (
                <NetworkContactCard
                  key={connection.id}
                  connection={connection}
                  onToggleFavorite={toggleFavorite}
                  onEdit={openEditor}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <EmptyState
            title="Aucune relation"
            description="Scannez un QR, utilisez le NFC ou activez Nearby pour construire votre reseau."
          />
        )}
      </main>

      <AnimatePresence>
        {editing && (
          <ModalPortal>
            <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
            <motion.div
              className="absolute inset-0 bg-black/75"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditing(null)}
              style={{ willChange: "opacity" }}
            />
            <motion.div
              className="relative z-10 w-full max-w-md flex flex-col max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-3.5rem)] overflow-hidden rounded-[30px] border border-white/10 bg-velora-dark shadow-2xl"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              style={{ willChange: "transform, opacity" }}
            >
              <div className="flex shrink-0 items-center justify-between border-b border-white/5 p-5">
                <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">Notes & Tags</h2>
                <button type="button" onClick={() => setEditing(null)} className="network-icon-btn">
                  <X size={15} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <textarea
                  value={draftNotes}
                  onChange={(event) => setDraftNotes(event.target.value)}
                  rows={4}
                  placeholder="Ajouter une note privee..."
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm outline-none placeholder:text-velora-text-muted focus:border-velora-gold/30"
                />
                <div className="flex flex-wrap gap-2">
                  {["Business", "Dentist", "Client", "VIP", "Friend", "Partner"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        draftTags.includes(tag)
                          ? "border-velora-gold/35 bg-velora-gold/12 text-velora-gold"
                          : "border-white/10 bg-white/[0.04] text-velora-text-muted"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-5 border-t border-white/5 bg-velora-dark/50 shrink-0">
                <button
                  type="button"
                  onClick={saveEditor}
                  disabled={saving}
                  className="w-full rounded-2xl bg-velora-gold py-3 text-sm font-semibold text-velora-black disabled:opacity-60"
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </motion.div>
          </div>
          </ModalPortal>
        )}
      </AnimatePresence>
    </div>
  );
}
