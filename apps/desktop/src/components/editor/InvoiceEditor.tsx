import { useState, useCallback, useImperativeHandle, forwardRef } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { HeroBlock } from "./blocks/HeroBlock";
import { GridBlock } from "./blocks/GridBlock";
import { TableBlock } from "./blocks/TableBlock";
import { DraggableBlockWrapper } from "./DraggableBlockWrapper";
import { motion } from "framer-motion";
import type { ClientResponse } from "../../lib/api";

export interface InvoiceData {
    clientId: string;
    items: { description: string; quantity: number; unit_price: number }[];
    notes: string;
}

export interface InvoiceEditorRef {
    getData: () => InvoiceData;
}

interface Props {
    clients: ClientResponse[];
}

export const InvoiceEditor = forwardRef<InvoiceEditorRef, Props>(({ clients }, ref) => {
    const [blocks, setBlocks] = useState([
        { id: "hero", type: "hero" },
        { id: "grid", type: "grid" },
        { id: "table", type: "table" },
    ]);

    // Lifted state
    const [selectedClientId, setSelectedClientId] = useState("");
    const [lineItems, setLineItems] = useState([
        { id: 1, description: "Frontend Development", quantity: 40, price: 150 },
        { id: 2, description: "UI/UX Design", quantity: 20, price: 125 },
    ]);
    const [notes, setNotes] = useState("");

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setBlocks((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }

    // Expose data to parent via ref
    useImperativeHandle(ref, () => ({
        getData: () => ({
            clientId: selectedClientId,
            items: lineItems.map((li) => ({
                description: li.description,
                quantity: li.quantity,
                unit_price: li.price,
            })),
            notes,
        }),
    }));

    const renderBlock = (type: string) => {
        switch (type) {
            case "hero": return <HeroBlock />;
            case "grid":
                return (
                    <GridBlock
                        clients={clients}
                        selectedClientId={selectedClientId}
                        onClientChange={setSelectedClientId}
                    />
                );
            case "table":
                return (
                    <TableBlock
                        items={lineItems}
                        onItemsChange={setLineItems}
                        notes={notes}
                        onNotesChange={setNotes}
                    />
                );
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col items-center py-12 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[210mm] min-h-[297mm] bg-[var(--surface)] text-[var(--foreground)] shadow-2xl rounded-sm ring-1 ring-white/10 relative overflow-hidden"
            >
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={blocks} strategy={verticalListSortingStrategy}>
                        {blocks.map((block) => (
                            <DraggableBlockWrapper key={block.id} id={block.id}>
                                {renderBlock(block.type)}
                            </DraggableBlockWrapper>
                        ))}
                    </SortableContext>
                </DndContext>

                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </motion.div>
        </div>
    );
});
