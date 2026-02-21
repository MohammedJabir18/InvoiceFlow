import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Copy, Palette } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DraggableBlockWrapperProps {
    id: string;
    children: React.ReactNode;
    onDelete?: () => void;
    onDuplicate?: () => void;
}

export function DraggableBlockWrapper({ id, children, onDelete, onDuplicate }: DraggableBlockWrapperProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
        position: "relative" as const,
    };

    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative mb-4 transition-all ${isDragging ? "opacity-50 scale-[1.02]" : ""}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Context Actions (Left) */}
            <AnimatePresence>
                {isHovered && !isDragging && (
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="absolute -left-12 top-0 bottom-0 flex flex-col justify-center gap-1 pr-2"
                    >
                        <div
                            {...attributes}
                            {...listeners}
                            className="p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/10 cursor-grab active:cursor-grabbing transition-colors"
                        >
                            <GripVertical size={16} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Context Menu (Right) */}
            <AnimatePresence>
                {isHovered && !isDragging && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="absolute -right-12 top-0 bottom-0 flex flex-col justify-center gap-1 pl-2"
                    >
                        <button
                            onClick={onDuplicate}
                            className="p-1.5 rounded-md text-white/40 hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                            title="Duplicate Block"
                        >
                            <Copy size={14} />
                        </button>
                        <button
                            className="p-1.5 rounded-md text-white/40 hover:text-purple-400 hover:bg-purple-400/10 transition-colors"
                            title="Change Style"
                        >
                            <Palette size={14} />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-1.5 rounded-md text-white/40 hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
                            title="Delete Block"
                        >
                            <Trash2 size={14} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Block Content */}
            <div className={`
                rounded-xl border transition-all duration-200
                ${isHovered ? "border-white/10 bg-white/[0.02] shadow-lg" : "border-transparent"}
                ${isDragging ? "border-[var(--primary)] shadow-2xl bg-[var(--surface)] ring-2 ring-[var(--primary)]/20" : ""}
            `}>
                {children}
            </div>
        </div>
    );
}
