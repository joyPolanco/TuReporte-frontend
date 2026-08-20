import React, { useState, useEffect } from "react";
import {
  MapPin, Camera, Bell, BarChart3, Users, Shield, ClipboardList, ArrowRight,
  CheckCircle2, Menu, X, Trophy, Building2, Clock, Sparkles, ChevronRight,
  ScanLine, Map as MapIcon, MessageCircle, Instagram, Youtube, Facebook,
  Star, TrendingUp, Award, Zap
} from "lucide-react";

/* ============================================================================
   TuReporte — Landing Page (página de presentación de la app)
   Esta es la puerta de entrada pública: explica qué es la app antes de
   pedirle al usuario que inicie sesión o se registre.
============================================================================ */

function Logo({ size = 34, dark = false }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="rounded-xl bg-gradient-to-br from-blue-800 to-teal-500 flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <MapPin size={size * 0.56} className="text-white" strokeWidth={2.4} />
      </div>
      <span className={`tr-display font-bold leading-none ${dark ? "text-white" : "text-slate-900"}`} style={{ fontSize: size * 0.5 }}>
        Tu<span className="text-teal-400">{dark ? "Reporte" : ""}</span>{!dark && <span className="text-teal-600">Reporte</span>}
      </span>
    </div>
  );
}

const NAV_LINKS = [
  { id: "caracteristicas", label: "Características" },
  { id: "como-funciona", label: "Cómo funciona" },
  { id: "roles", label: "Para tu institución" },
  { id: "faq", label: "Preguntas" },
];

function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

function NavBar({ onLogin, onRegister }) {
  const [open, setOpen] = useState(false);
  const scrolled = useScrolled();

  const scrollTo = (id) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "tr-glass shadow-sm py-2.5" : "bg-transparent py-4"}`}>
      <div className="max-w-6xl mx-auto px-5 flex items-center justify-between">
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="shrink-0">
          <Logo size={34} />
        </button>

        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className={`text-sm font-semibold transition ${scrolled ? "text-slate-600 hover:text-teal-700" : "text-slate-700 hover:text-teal-700"}`}
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button onClick={onLogin} className="text-sm font-semibold text-slate-700 hover:text-teal-700 px-3 py-2 transition">
            Iniciar sesión
          </button>
          <button
            onClick={onRegister}
            className="rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2.5 flex items-center gap-1.5 transition shadow-sm shadow-blue-900/20"
          >
            Registrarse <ArrowRight size={15} />
          </button>
        </div>

        <button onClick={() => setOpen((o) => !o)} className="md:hidden p-2 rounded-lg text-slate-700 bg-white/70">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden tr-glass mt-2.5 mx-4 rounded-2xl p-4 shadow-lg tr-fade-up">
          {NAV_LINKS.map((l) => (
            <button key={l.id} onClick={() => scrollTo(l.id)} className="block w-full text-left py-2.5 text-sm font-semibold text-slate-700">
              {l.label}
            </button>
          ))}
          <div className="h-px bg-slate-200 my-2" />
          <button onClick={onLogin} className="block w-full text-left py-2.5 text-sm font-semibold text-slate-700">
            Iniciar sesión
          </button>
          <button
            onClick={onRegister}
            className="w-full mt-1 rounded-xl bg-blue-900 text-white text-sm font-semibold py-2.5 flex items-center justify-center gap-1.5"
          >
            Crear cuenta <ArrowRight size={15} />
          </button>
        </div>
      )}
    </header>
  );
}

/* ------------------------------- HERO ------------------------------------ */

function PhoneMockup() {
  return (
    <div className="relative w-full max-w-[300px] mx-auto tr-float">
      <div className="rounded-[2.5rem] border-[8px] border-slate-900 bg-slate-900 shadow-2xl overflow-hidden">
        <div className="bg-slate-50 aspect-[9/18.5] flex flex-col">
          {/* status/header bar */}
          <div className="bg-gradient-to-br from-blue-900 to-teal-600 px-4 pt-6 pb-4">
            <div className="flex items-center justify-between mb-3">
              <Logo size={22} dark />
              <Bell size={16} className="text-white/90" />
            </div>
            <p className="text-white/80 text-[10px] font-semibold">Distrito Nacional</p>
          </div>
          {/* feed cards */}
          <div className="flex-1 p-3 space-y-2.5 overflow-hidden">
            {[
              { c: "bg-orange-100 text-orange-700", label: "Bache en la vía", status: "En proceso", sbg: "bg-blue-100 text-blue-700" },
              { c: "bg-cyan-100 text-cyan-700", label: "Fuga de agua", status: "Recibido", sbg: "bg-amber-100 text-amber-700" },
              { c: "bg-yellow-100 text-yellow-800", label: "Luminaria dañada", status: "Resuelto", sbg: "bg-emerald-100 text-emerald-700" },
            ].map((r, i) => (
              <div key={i} className="tr-glass-card rounded-2xl p-2.5 tr-fade-up" style={{ animationDelay: `${i * 0.12}s` }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-6 h-6 rounded-lg ${r.c} flex items-center justify-center`}>
                    <Camera size={12} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-800 leading-tight">{r.label}</p>
                  </div>
                </div>
                <div className="h-12 rounded-lg bg-slate-200/70 mb-1.5" />
                <span className={`inline-block text-[8px] font-bold px-2 py-0.5 rounded-full ${r.sbg}`}>{r.status}</span>
              </div>
            ))}
          </div>
          {/* bottom nav */}
          <div className="flex items-center justify-around py-2.5 bg-white border-t border-slate-100">
            {[MapIcon, Camera, MessageCircle, Users].map((Ic, i) => (
              <Ic key={i} size={16} className={i === 1 ? "text-teal-600" : "text-slate-300"} />
            ))}
          </div>
        </div>
      </div>
      {/* floating badge */}
      <div className="absolute -right-6 top-16 tr-glass-card rounded-2xl px-3 py-2 shadow-lg tr-float-delayed hidden sm:flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center">
          <CheckCircle2 size={14} className="text-teal-600" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-800 leading-none">+15 puntos</p>
          <p className="text-[8px] text-slate-500 mt-0.5">Reporte publicado</p>
        </div>
      </div>
      <div className="absolute -left-8 bottom-24 tr-glass-card rounded-2xl px-3 py-2 shadow-lg hidden sm:flex items-center gap-2">
        <Trophy size={14} className="text-amber-500" />
        <p className="text-[10px] font-bold text-slate-800">Nivel 4 · Vecino activo</p>
      </div>
    </div>
  );
}

function Hero({ onRegister, onLogin }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-teal-800 pt-28 pb-20 md:pt-40 md:pb-28">
      {/* decorative blobs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-teal-500/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-blue-400/10 blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-5 grid md:grid-cols-2 gap-12 items-center">
        <div className="tr-fade-up">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 mb-5">
            <Sparkles size={13} className="text-teal-300" />
            <span className="text-[11px] font-bold text-teal-100 uppercase tracking-wide">Gran Santo Domingo</span>
          </div>
          <h1 className="tr-display text-4xl md:text-5xl font-bold text-white leading-[1.1] mb-5">
            Tu ciudad, <span className="text-teal-300">tu voz</span>, tu comunidad
          </h1>
          <p className="text-blue-100/90 text-base md:text-lg leading-relaxed mb-8 max-w-md">
            Reporta baches, fugas, apagones y más en segundos. Dale seguimiento en tiempo real
            y mira cómo tu institución responde, todo desde una sola app.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onRegister}
              className="rounded-xl bg-teal-500 hover:bg-teal-400 text-blue-950 font-bold px-6 py-3.5 text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-teal-500/25"
            >
              Crear cuenta gratis <ArrowRight size={16} />
            </button>
            <button
              onClick={onLogin}
              className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold px-6 py-3.5 text-sm transition"
            >
              Ya tengo cuenta
            </button>
          </div>
          <div className="flex items-center gap-5 mt-8">
            {[
              { n: "8", l: "municipios cubiertos" },
              { n: "15", l: "instituciones conectadas" },
              { n: "< 24h", l: "primera respuesta prom." },
            ].map((s, i) => (
              <div key={i} className={i > 0 ? "pl-5 border-l border-white/15" : ""}>
                <p className="tr-display text-xl font-bold text-white">{s.n}</p>
                <p className="text-[11px] text-blue-200/80 leading-tight max-w-[80px]">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="tr-fade-up" style={{ animationDelay: "0.15s" }}>
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- LOGOS / TRUST ------------------------------- */

function TrustStrip() {
  const items = ["ADN", "ASDE", "CAASD", "INAPA", "MOPC", "EDE-Este"];
  return (
    <section className="bg-white border-b border-slate-100 py-6">
      <div className="max-w-6xl mx-auto px-5">
        <p className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4">
          Conectado con instituciones y ayuntamientos
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {items.map((it) => (
            <span key={it} className="tr-mono text-sm font-bold text-slate-400">{it}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ FEATURES ---------------------------------- */

const FEATURES = [
  {
    Icon: Camera,
    title: "Reporta en segundos",
    desc: "Toma hasta 5 fotos, elige la categoría y ubica el problema en el mapa. Puedes reportar de forma anónima o pública.",
    color: "from-orange-400 to-amber-500",
  },
  {
    Icon: ScanLine,
    title: "Registro con validación OCR",
    desc: "Verificamos tu cédula automáticamente al registrarte, para mantener una comunidad de vecinos reales.",
    color: "from-blue-500 to-blue-700",
  },
  {
    Icon: MapIcon,
    title: "Mapa comunitario en vivo",
    desc: "Visualiza las incidencias de tu zona y del Gran Santo Domingo, con densidad y prioridad por área.",
    color: "from-teal-400 to-cyan-600",
  },
  {
    Icon: Bell,
    title: "Seguimiento en tiempo real",
    desc: "Línea de tiempo de cada reporte: recibido, en proceso, resuelto. Sin llamadas ni filas.",
    color: "from-purple-400 to-purple-600",
  },
 
  {
    Icon: BarChart3,
    title: "Paneles para instituciones",
    desc: "Gestores y administradores priorizan, asignan y miden cumplimiento de SLA con métricas claras.",
    color: "from-emerald-400 to-emerald-600",
  },
];

function FeatureCard({ f, i }) {
  const { Icon } = f;
  return (
    <div
      className="group rounded-2xl border border-slate-100 bg-white p-6 hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1 transition-all duration-300 tr-fade-up"
      style={{ animationDelay: `${i * 0.08}s` }}
    >
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-sm`}>
        <Icon size={20} className="text-white" />
      </div>
      <h3 className="tr-display font-bold text-slate-900 mb-1.5">{f.title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
    </div>
  );
}

function Features() {
  return (
    <section id="caracteristicas" className="py-20 md:py-28 bg-slate-50">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center max-w-xl mx-auto mb-14 tr-fade-up">
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-600 mb-2">Todo en una sola app</p>
          <h2 className="tr-display text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Diseñada para vecinos e instituciones
          </h2>
          <p className="text-slate-500 text-sm md:text-base">
            TuReporte conecta a la ciudadanía con los ayuntamientos y organismos responsables,
            de forma simple, transparente y medible.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => <FeatureCard key={f.title} f={f} i={i} />)}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- HOW IT WORKS -------------------------------- */

const STEPS = [
  { n: "01", Icon: ScanLine, title: "Crea tu cuenta", desc: "Regístrate en dos pasos con validación de cédula. Toma menos de 2 minutos." },
  { n: "02", Icon: Camera, title: "Reporta la incidencia", desc: "Añade fotos, describe el problema y ubica la zona afectada en el mapa." },
  { n: "03", Icon: Clock, title: "Sigue el progreso", desc: "La institución responsable recibe, prioriza y actualiza el estado del caso." },
  { n: "04", Icon: Trophy, title: "Suma puntos", desc: "Gana reconocimiento por cada reporte y ayuda a mejorar tu comunidad." },
];

function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center max-w-xl mx-auto mb-14 tr-fade-up">
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-600 mb-2">Proceso simple</p>
          <h2 className="tr-display text-3xl md:text-4xl font-bold text-slate-900">Cómo funciona TuReporte</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s, i) => (
            <div key={s.n} className="relative tr-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 h-full">
                <span className="tr-mono text-3xl font-bold text-slate-200 block mb-3">{s.n}</span>
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center mb-3">
                  <s.Icon size={18} className="text-teal-700" />
                </div>
                <h3 className="tr-display font-bold text-slate-900 mb-1.5">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight size={18} className="hidden lg:block absolute top-1/2 -right-3.5 -translate-y-1/2 text-slate-300" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- ROLES ------------------------------------ */

const ROLES = [
  {
    Icon: Users,
    title: "Ciudadano",
    color: "text-teal-600 bg-teal-100",
    desc: "Reporta, comenta y da seguimiento a incidencias de tu comunidad.",
    points: ["Feed comunitario tipo red social", "Reportes con foto y ubicación", "Perfil con puntos y logros"],
  },
  {
    Icon: ClipboardList,
    title: "Gestor",
    color: "text-blue-700 bg-blue-100",
    desc: "Clasifica, prioriza y asigna reportes a la institución correspondiente.",
    points: ["Bandeja con prioridad y SLA", "Línea de tiempo por caso", "Mapa de cobertura territorial"],
  },
  {
    Icon: Shield,
    title: "Administrador",
    color: "text-slate-700 bg-slate-200",
    desc: "Supervisa métricas, cumplimiento e institucionalidad a nivel nacional.",
    points: ["Dashboard de KPIs y gráficas", "Cumplimiento de SLA por institución", "Gestión de usuarios y accesos"],
  },
];

function Roles({ onRegister }) {
  return (
    <section id="roles" className="py-20 md:py-28 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center max-w-xl mx-auto mb-14 tr-fade-up">
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-400 mb-2">Un rol para cada quien</p>
          <h2 className="tr-display text-3xl md:text-4xl font-bold text-white mb-3">Para tu comunidad y tu institución</h2>
          <p className="text-blue-100/70 text-sm md:text-base">
            La misma plataforma se adapta a ciudadanos, gestores municipales y administradores.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {ROLES.map((r, i) => (
            <div key={r.title} className="tr-glass-dark rounded-2xl p-6 tr-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={`w-11 h-11 rounded-xl ${r.color} flex items-center justify-center mb-4`}>
                <r.Icon size={20} />
              </div>
              <h3 className="tr-display font-bold text-white text-lg mb-1.5">{r.title}</h3>
              <p className="text-sm text-blue-100/70 mb-4 leading-relaxed">{r.desc}</p>
              <ul className="space-y-2">
                {r.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-xs text-blue-100/80">
                    <CheckCircle2 size={14} className="text-teal-400 shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-center mt-12 tr-fade-up">
          <button
            onClick={onRegister}
            className="rounded-xl bg-teal-500 hover:bg-teal-400 text-blue-950 font-bold px-7 py-3.5 text-sm inline-flex items-center gap-2 transition shadow-lg shadow-teal-500/20"
          >
            Comienza gratis hoy <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- FAQ ------------------------------------- */

const FAQS = [
  { q: "¿TuReporte tiene algún costo?", a: "No, crear una cuenta y reportar incidencias es completamente gratuito para todos los ciudadanos." },
  { q: "¿Puedo reportar de forma anónima?", a: "Sí. Al publicar un reporte puedes elegir que tu nombre no sea visible para otros usuarios del feed comunitario." },
  { q: "¿Qué pasa después de enviar un reporte?", a: "Tu reporte se asigna automáticamente a la institución responsable según la zona y categoría, y puedes seguir su estado en tiempo real." },
  { q: "¿Qué municipios cubre la app?", a: "Actualmente cubrimos el Distrito Nacional y toda la provincia Santo Domingo: Este, Norte, Oeste, Los Alcarrizos, Boca Chica, Pedro Brand y San Antonio de Guerra." },
];

function Faq() {
  const [openIdx, setOpenIdx] = useState(0);
  return (
    <section id="faq" className="py-20 md:py-28 bg-slate-50">
      <div className="max-w-3xl mx-auto px-5">
        <div className="text-center mb-12 tr-fade-up">
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-600 mb-2">Dudas frecuentes</p>
          <h2 className="tr-display text-3xl md:text-4xl font-bold text-slate-900">Preguntas frecuentes</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <div key={f.q} className="rounded-2xl border border-slate-200 bg-white overflow-hidden tr-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
              <button
                onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <span className="font-semibold text-slate-800 text-sm">{f.q}</span>
                <ChevronRight size={16} className={`text-slate-400 shrink-0 transition-transform ${openIdx === i ? "rotate-90" : ""}`} />
              </button>
              {openIdx === i && (
                <p className="px-5 pb-4 text-sm text-slate-500 leading-relaxed tr-fade-in">{f.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ CTA BANNER --------------------------------- */

function CtaBanner({ onRegister }) {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-5xl mx-auto px-5">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 to-teal-700 px-8 py-14 md:py-16 text-center">
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-teal-300/20 blur-3xl" />
          <div className="relative">
            <h2 className="tr-display text-2xl md:text-3xl font-bold text-white mb-3">
              Tu reporte puede mejorar tu barrio hoy
            </h2>
            <p className="text-blue-100/85 text-sm md:text-base max-w-lg mx-auto mb-7">
              Únete a miles de vecinos que ya están usando TuReporte para transformar
              su comunidad, un reporte a la vez.
            </p>
            <button
              onClick={onRegister}
              className="rounded-xl bg-white hover:bg-blue-50 text-blue-900 font-bold px-7 py-3.5 text-sm inline-flex items-center gap-2 transition shadow-lg"
            >
              Crear mi cuenta gratis <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- FOOTER ----------------------------------- */

const SOCIALS = [
  {
    Icon: Instagram,
    label: "Instagram",
    href: "https://www.instagram.com/tureporte.do?igsh=bDh3NzBka2Nyc3Bz&utm_source=qr",
  },
  {
    Icon: Youtube,
    label: "YouTube",
    href: "https://www.youtube.com/@Tureporterd",
  },
];

function Footer() {
  return (
    <footer className="bg-slate-950 pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-5">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          <div className="lg:col-span-1">
            <Logo size={32} dark />
            <p className="text-slate-400 text-sm mt-4 leading-relaxed max-w-[240px]">
              Plataforma digital de gestión de incidencias comunitarias para el Gran Santo Domingo.
            </p>
            <div className="flex items-center gap-2.5 mt-5">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-teal-500 flex items-center justify-center text-slate-300 hover:text-white transition"
                >
                  <s.Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-white text-xs font-bold uppercase tracking-wider mb-4">Producto</p>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><a href="#caracteristicas" className="hover:text-teal-400 transition">Características</a></li>
              <li><a href="#como-funciona" className="hover:text-teal-400 transition">Cómo funciona</a></li>
              <li><a href="#roles" className="hover:text-teal-400 transition">Para instituciones</a></li>
              <li><a href="#faq" className="hover:text-teal-400 transition">Preguntas frecuentes</a></li>
            </ul>
          </div>

          <div>
            <p className="text-white text-xs font-bold uppercase tracking-wider mb-4">Cobertura</p>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>Distrito Nacional</li>
              <li>Santo Domingo Este, Norte y Oeste</li>
              <li>Los Alcarrizos · Boca Chica</li>
              <li>Pedro Brand · San Antonio de Guerra</li>
            </ul>
          </div>

          <div>
            <p className="text-white text-xs font-bold uppercase tracking-wider mb-4">Contacto</p>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>atencion@tureporte.do</li>
              <li>Santo Domingo, República Dominicana</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6">
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} TuReporte. Proyecto ITLA — Grupo 45.</p>
          <div className="flex items-center gap-5 text-xs text-slate-500">
            <a href="#" className="hover:text-teal-400 transition">Términos de uso</a>
            <a href="#" className="hover:text-teal-400 transition">Privacidad</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ---------------------------------------------------------------------------
   PÁGINA COMPLETA
--------------------------------------------------------------------------- */

export default function LandingPage({ onLogin, onRegister }) {
  return (
    <div className="tr-root bg-white">
      <NavBar onLogin={onLogin} onRegister={onRegister} />
      <main>
        <Hero onRegister={onRegister} onLogin={onLogin} />
        <TrustStrip />
        <Features />
        <HowItWorks />
        <Roles onRegister={onRegister} />
        <Faq />
        <CtaBanner onRegister={onRegister} />
      </main>
      <Footer />
    </div>
  );
}
