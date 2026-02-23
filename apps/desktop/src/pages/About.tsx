import { motion } from "framer-motion";
import {
    Github,
    Linkedin,
    Twitter,
    Instagram,
    Mail,
    Globe,
    ExternalLink,
    Sparkles,
    Cpu,
    Zap,
    Code2,
    Briefcase,
    GraduationCap,
    ArrowUpRight,
    MapPin,
    Calendar
} from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";

// ─── Data ──────────────────────────────────────────────────────

const developer = {
    name: "Mohammed Jabir",
    initials: "MJ",
    title: "AI & Automation Specialist",
    subtitle: "Full-Stack Developer & AI Architect",
    location: "Kerala, India",
    bio: "Results-driven specialist building intelligent systems and data-driven solutions. I leverage Next.js, n8n, and AI tools to deliver business outcomes that make a real impact.",
    email: "jabirahmedz111@gmail.com",
    website: "https://mohammedjabir.me",
};

const socialLinks = [
    { icon: Github, label: "GitHub", url: "https://github.com/MohammedJabir18", color: "#f0f6fc", handle: "@MohammedJabir18" },
    { icon: Linkedin, label: "LinkedIn", url: "https://www.linkedin.com/in/mohammed--jabir", color: "#0a66c2", handle: "mohammed--jabir" },
    { icon: Twitter, label: "Twitter", url: "https://twitter.com/mohammedjabir__", color: "#1da1f2", handle: "@mohammedjabir__" },
    { icon: Instagram, label: "Instagram", url: "https://www.instagram.com/mohammedjabir__/", color: "#e4405f", handle: "@mohammedjabir__" },
    { icon: Mail, label: "Email", url: "mailto:jabirahmedz111@gmail.com", color: "#34d399", handle: "jabirahmedz111" },
    { icon: Globe, label: "Website", url: "https://mohammedjabir.me", color: "#38bdf8", handle: "mohammedjabir.me" },
];

const techStack = [
    { name: "Next.js", category: "Framework" },
    { name: "React", category: "Frontend" },
    { name: "TypeScript", category: "Language" },
    { name: "Rust", category: "Systems" },
    { name: "Tauri", category: "Desktop" },
    { name: "n8n", category: "Automation" },
    { name: "Python", category: "AI/ML" },
    { name: "OpenAI", category: "LLM" },
    { name: "Pinecone", category: "Vector DB" },
    { name: "SQLite", category: "Database" },
    { name: "Tailwind", category: "CSS" },
    { name: "Node.js", category: "Runtime" },
];

const projects = [
    {
        title: "BitBondit",
        description: "Full-scale enterprise SaaS with real-time data sync, complex dashboards, and 98+ Lighthouse score.",
        url: "https://www.bitbondit.com/",
        tag: "Enterprise SaaS",
        gradient: "from-violet-500/20 to-fuchsia-500/20",
        border: "border-violet-500/20",
    },
    {
        title: "Vault79",
        description: "End-to-end digital solutions platform with full-cycle development from concept to deployment.",
        url: "https://vault79.in/",
        tag: "Digital Platform",
        gradient: "from-sky-500/20 to-cyan-500/20",
        border: "border-sky-500/20",
    },
    {
        title: "AI Automation Suite",
        description: "RAG pipeline integrating n8n, Pinecone, and OpenAI for automated chatbots and intelligent document processing.",
        url: null,
        tag: "AI / ML",
        gradient: "from-emerald-500/20 to-teal-500/20",
        border: "border-emerald-500/20",
    },
];

const experience = [
    { role: "Business Executive", icon: Briefcase },
    { role: "Amazon Selling Intern", icon: Briefcase },
    { role: "Python Developer Intern", icon: Code2 },
    { role: "Web Design Intern", icon: GraduationCap },
];

const stats = [
    { label: "Faster Decisions", value: "10×", icon: Zap },
    { label: "Lead Increase", value: "300%", icon: Sparkles },
    { label: "Lighthouse", value: "98+", icon: Cpu },
];

// ─── Animations ────────────────────────────────────────────────

const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

// ─── Component ─────────────────────────────────────────────────

export function About() {
    const handleLink = (url: string) => {
        open(url).catch(() => window.open(url, "_blank"));
    };

    return (
        <motion.div
            className="w-full max-w-[1200px] mx-auto pb-16"
            variants={stagger}
            initial="hidden"
            animate="visible"
        >
            {/* ─── Page Header ─── */}
            <motion.div variants={fadeUp} className="mb-10">
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-px w-8 bg-gradient-to-r from-[var(--primary)] to-transparent" />
                    <span className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--primary)] opacity-80">
                        Developer Profile
                    </span>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-[var(--foreground)]">
                    About <span className="text-gradient">the Creator</span>
                </h1>
            </motion.div>

            {/* ─── Hero Card ─── */}
            <motion.div
                variants={scaleIn}
                className="glass-panel relative rounded-3xl overflow-hidden mb-8"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}
            >
                {/* Ambient glows */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--primary)] opacity-[0.07] blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[var(--secondary)] opacity-[0.07] blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10 p-8 sm:p-10 flex flex-col lg:flex-row gap-8 items-start">
                    {/* Avatar */}
                    <motion.div
                        className="relative flex-shrink-0"
                        whileHover={{ scale: 1.03 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] p-[2px] shadow-[0_0_40px_rgba(45,212,191,0.2)]">
                            <img
                                src="/assets/developer-photo.jpg"
                                alt={developer.name}
                                className="w-full h-full rounded-2xl object-cover"
                            />
                        </div>
                        {/* Online indicator */}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-[3px] border-[var(--surface)] shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                    </motion.div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight mb-1">
                            {developer.name}
                        </h2>
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary)]">
                                <Cpu size={14} /> {developer.title}
                            </span>
                            <span className="text-[var(--foreground)] opacity-20">•</span>
                            <span className="inline-flex items-center gap-1.5 text-sm text-[var(--foreground)] opacity-60">
                                <MapPin size={14} /> {developer.location}
                            </span>
                        </div>
                        <p className="text-[var(--foreground)] opacity-60 text-[0.95rem] leading-relaxed max-w-2xl mb-6">
                            {developer.bio}
                        </p>

                        {/* Quick Actions */}
                        <div className="flex flex-wrap gap-3">
                            <motion.button
                                whileHover={{ scale: 1.03, boxShadow: "0 0 30px rgba(45,212,191,0.3)" }}
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-semibold text-sm shadow-lg transition-all"
                                onClick={() => handleLink(developer.website)}
                            >
                                <Globe size={16} /> Visit Portfolio
                                <ArrowUpRight size={14} className="opacity-60" />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 text-[var(--foreground)] font-semibold text-sm border border-[var(--foreground)]/10 transition-all"
                                onClick={() => handleLink(`mailto:${developer.email}`)}
                            >
                                <Mail size={16} /> Get in Touch
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ─── Stats Row ─── */}
            <motion.div variants={fadeUp} className="grid grid-cols-3 gap-4 mb-8">
                {stats.map((stat) => (
                    <motion.div
                        key={stat.label}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="glass-panel rounded-2xl p-5 text-center relative overflow-hidden group cursor-default"
                        style={{ border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <stat.icon size={20} className="mx-auto mb-2 text-[var(--primary)] opacity-80" />
                        <div className="text-2xl font-black text-[var(--foreground)] tracking-tight">{stat.value}</div>
                        <div className="text-xs font-semibold text-[var(--foreground)] opacity-40 uppercase tracking-wider mt-1">{stat.label}</div>
                    </motion.div>
                ))}
            </motion.div>

            {/* ─── Social Links Grid ─── */}
            <motion.div variants={fadeUp} className="mb-8">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                        <Zap size={16} className="text-[var(--primary)]" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--foreground)] tracking-tight">Connect</h3>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {socialLinks.map((link, i) => (
                        <motion.div
                            key={link.label}
                            variants={fadeUp}
                            whileHover={{ scale: 1.02, y: -3 }}
                            whileTap={{ scale: 0.97 }}
                            className="glass-panel rounded-xl p-4 flex items-center gap-3.5 cursor-pointer group relative overflow-hidden transition-all"
                            style={{ border: '1px solid rgba(255,255,255,0.05)' }}
                            onClick={() => handleLink(link.url)}
                        >
                            {/* Hover glow */}
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                style={{ background: `radial-gradient(circle at 30% 50%, ${link.color}10, transparent 70%)` }}
                            />
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10 transition-all duration-300 group-hover:shadow-lg"
                                style={{
                                    background: `${link.color}15`,
                                    border: `1px solid ${link.color}25`,
                                }}
                            >
                                <link.icon size={18} style={{ color: link.color }} />
                            </div>
                            <div className="flex-1 min-w-0 relative z-10">
                                <div className="text-sm font-bold text-[var(--foreground)] group-hover:text-white transition-colors">{link.label}</div>
                                <div className="text-xs text-[var(--foreground)] opacity-40 truncate">{link.handle}</div>
                            </div>
                            <ExternalLink size={14} className="text-[var(--foreground)] opacity-0 group-hover:opacity-40 transition-opacity relative z-10 flex-shrink-0" />
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* ─── Two-Column: Tech Stack + Experience ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

                {/* Tech Stack */}
                <motion.div variants={fadeUp}>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-[var(--secondary)]/10 flex items-center justify-center">
                            <Code2 size={16} className="text-[var(--secondary)]" />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--foreground)] tracking-tight">Tech Stack</h3>
                    </div>
                    <div
                        className="glass-panel rounded-2xl p-5 relative overflow-hidden"
                        style={{ border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <div className="absolute -right-16 -bottom-16 w-40 h-40 bg-[var(--secondary)] opacity-[0.04] blur-[60px] rounded-full pointer-events-none" />
                        <div className="flex flex-wrap gap-2 relative z-10">
                            {techStack.map((tech) => (
                                <motion.div
                                    key={tech.name}
                                    whileHover={{ scale: 1.08, y: -1 }}
                                    className="group relative cursor-default"
                                >
                                    <div className="px-3 py-1.5 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/8 text-sm font-semibold text-[var(--foreground)] opacity-80 group-hover:opacity-100 group-hover:border-[var(--primary)]/30 group-hover:bg-[var(--primary)]/8 transition-all duration-300">
                                        {tech.name}
                                    </div>
                                    {/* Tooltip */}
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-bold text-[var(--primary)] bg-[var(--surface)] border border-[var(--foreground)]/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                                        {tech.category}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Experience */}
                <motion.div variants={fadeUp}>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Calendar size={16} className="text-amber-400" />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--foreground)] tracking-tight">Experience</h3>
                    </div>
                    <div
                        className="glass-panel rounded-2xl p-5 relative overflow-hidden"
                        style={{ border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <div className="absolute -left-16 -top-16 w-40 h-40 bg-amber-400 opacity-[0.04] blur-[60px] rounded-full pointer-events-none" />
                        <div className="space-y-1 relative z-10">
                            {experience.map((exp, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--foreground)]/5 transition-colors group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-[var(--foreground)]/5 border border-[var(--foreground)]/8 flex items-center justify-center group-hover:border-amber-500/30 group-hover:bg-amber-500/8 transition-all">
                                        <exp.icon size={14} className="text-[var(--foreground)] opacity-50 group-hover:text-amber-400 transition-colors" />
                                    </div>
                                    <span className="text-sm font-semibold text-[var(--foreground)] opacity-70 group-hover:opacity-100 transition-opacity">
                                        {exp.role}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ─── Featured Projects ─── */}
            <motion.div variants={fadeUp}>
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <Sparkles size={16} className="text-violet-400" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--foreground)] tracking-tight">Featured Projects</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {projects.map((project, i) => (
                        <motion.div
                            key={project.title}
                            variants={fadeUp}
                            whileHover={{ scale: 1.02, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            className={`glass-panel rounded-2xl p-6 relative overflow-hidden cursor-pointer group ${project.border}`}
                            style={{ border: `1px solid rgba(255,255,255,0.06)` }}
                            onClick={() => project.url && handleLink(project.url)}
                        >
                            {/* Background gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${project.gradient} opacity-30 group-hover:opacity-60 transition-opacity duration-500`} />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--foreground)] opacity-40 px-2 py-0.5 rounded-full bg-[var(--foreground)]/5 border border-[var(--foreground)]/8">
                                        {project.tag}
                                    </span>
                                    {project.url && (
                                        <ArrowUpRight size={16} className="text-[var(--foreground)] opacity-0 group-hover:opacity-60 transition-all transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                                    )}
                                </div>
                                <h4 className="text-xl font-extrabold text-[var(--foreground)] mb-2 tracking-tight">
                                    {project.title}
                                </h4>
                                <p className="text-sm text-[var(--foreground)] opacity-50 leading-relaxed line-clamp-3">
                                    {project.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* ─── Footer Attribution ─── */}
            <motion.div variants={fadeUp} className="mt-12 text-center">
                <p className="text-xs text-[var(--foreground)] opacity-30 font-medium tracking-wide">
                    Built with ❤️ using <span className="text-[var(--primary)] opacity-80">Rust</span>, <span className="text-[var(--secondary)] opacity-80">React</span>, and <span className="text-amber-400 opacity-80">Tauri</span>
                </p>
                <p className="text-[10px] text-[var(--foreground)] opacity-20 mt-1">
                    © 2026 Mohammed Jabir M. All rights reserved.
                </p>
            </motion.div>
        </motion.div>
    );
}
