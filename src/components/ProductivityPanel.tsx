import { React, useState, useCallback } from "@webpack/common";
import { CardStyles, ButtonStyles, InputStyles, ListStyles, SwitchStyles, DiscordColors } from "../styles";
import type { TodoItem, TodoPriority, ReminderItem } from "../types";

interface ProductivityPanelProps {
    todoTasks: TodoItem[];
    reminders: ReminderItem[];
    passcodeEnabled: boolean;
    onAddTodo: (text: string, priority: TodoPriority, deadline: number) => TodoItem;
    onToggleTodo: (id: string) => void;
    onRemoveTodo: (id: string) => void;
    onClearDoneTodos: () => void;
    onAddReminder: (text: string, dueAt: number, repeatMinutes: number) => ReminderItem;
    onRemoveReminder: (id: string) => void;
    onSetPasscode: (pin: string | null) => void;
    onSetPasscodeEnabled: (value: boolean) => void;
}

const PRIORITY_LABELS: Record<TodoPriority, { label: string; color: string }> = {
    high: { label: "🔴 High", color: DiscordColors.danger },
    medium: { label: "🟠 Medium", color: DiscordColors.warning },
    low: { label: "🟢 Low", color: DiscordColors.success },
};

const ProductivityPanel: React.FC<ProductivityPanelProps> = ({
    todoTasks,
    reminders,
    passcodeEnabled,
    onAddTodo,
    onToggleTodo,
    onRemoveTodo,
    onClearDoneTodos,
    onAddReminder,
    onRemoveReminder,
    onSetPasscode,
    onSetPasscodeEnabled,
}) => {
    const [todoText, setTodoText] = useState("");
    const [todoPriority, setTodoPriority] = useState<TodoPriority>("medium");
    const [todoDeadline, setTodoDeadline] = useState("");
    const [reminderText, setReminderText] = useState("");
    const [reminderMinutes, setReminderMinutes] = useState("15");
    const [passcodeInput, setPasscodeInput] = useState("");
    // captured once per mount — avoids impure Date.now() calls inside render
    const [nowTs] = useState(() => Date.now());

    const handleAddTodo = useCallback(() => {
        const text = todoText.trim();
        if (!text) return;
        const deadline = todoDeadline ? new Date(todoDeadline).getTime() : 0;
        onAddTodo(text, todoPriority, Number.isFinite(deadline) ? deadline : 0);
        setTodoText("");
        setTodoDeadline("");
    }, [todoText, todoPriority, todoDeadline, onAddTodo]);

    const handleAddReminder = useCallback(() => {
        const text = reminderText.trim();
        const minutes = Number(reminderMinutes) || 0;
        if (!text || minutes <= 0) return;
        onAddReminder(text, Date.now() + minutes * 60000, minutes);
        setReminderText("");
    }, [reminderText, reminderMinutes, onAddReminder]);

    const handleSetPasscode = useCallback(() => {
        const pin = passcodeInput.trim();
        if (pin.length < 4) return;
        onSetPasscode(pin);
        setPasscodeInput("");
    }, [passcodeInput, onSetPasscode]);

    const pending = todoTasks.filter(t => !t.done);
    const done = todoTasks.filter(t => t.done);

    return (
        <div style={CardStyles.container}>
            <div style={CardStyles.header}>
                <div>
                    <h3 style={CardStyles.title}>✅ Productivité</h3>
                    <p style={CardStyles.description}>
                        ToDoList, reminders et verrouillage client — intégrés nativement dans EGO TOOL
                    </p>
                </div>
            </div>

            {/* To-Do */}
            <div style={CardStyles.card}>
                <h4 style={CardStyles.cardTitle}>To-Do List ({pending.length} à faire · {done.length} terminées)</h4>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                    <input
                        style={{ ...InputStyles.text, flex: 1, minWidth: "180px" }}
                        placeholder="Nouvelle tâche..."
                        value={todoText}
                        onChange={(e) => setTodoText(e.target.value)}
                        onKeyUp={(e) => { if (e.key === "Enter") handleAddTodo(); }}
                    />
                    <select
                        style={InputStyles.select}
                        value={todoPriority}
                        onChange={(e) => setTodoPriority(e.target.value as TodoPriority)}
                    >
                        <option value="high">🔴 High</option>
                        <option value="medium">🟠 Medium</option>
                        <option value="low">🟢 Low</option>
                    </select>
                    <input
                        type="datetime-local"
                        style={{ ...InputStyles.text, minWidth: "170px" }}
                        value={todoDeadline}
                        onChange={(e) => setTodoDeadline(e.target.value)}
                    />
                    <button onClick={handleAddTodo} disabled={!todoText.trim()} style={ButtonStyles.primary}>
                        ➕ Ajouter
                    </button>
                    {done.length > 0 && (
                        <button onClick={() => onClearDoneTodos()} style={ButtonStyles.ghost}>
                            🧹 Nettoyer
                        </button>
                    )}
                </div>

                {todoTasks.length > 0 ? (
                    <div style={ListStyles.items}>
                        {[...pending, ...done].map((task) => {
                            const prio = PRIORITY_LABELS[task.priority];
                            const overdue = task.deadline > 0 && task.deadline < nowTs && !task.done;
                            return (
                                <div
                                    key={task.id}
                                    style={{
                                        ...ListStyles.item,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        opacity: task.done ? 0.55 : 1,
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={task.done}
                                        onChange={() => onToggleTodo(task.id)}
                                        style={{ width: "16px", height: "16px", accentColor: DiscordColors.primary }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: "13px",
                                            color: DiscordColors.textNormal,
                                            textDecoration: task.done ? "line-through" : "none",
                                        }}>
                                            {task.text}
                                        </div>
                                        {task.deadline > 0 && (
                                            <div style={{ fontSize: "11px", color: overdue ? DiscordColors.danger : DiscordColors.textMuted }}>
                                                {overdue ? "⏰ en retard — " : "📅 échéance — "}
                                                {new Date(task.deadline).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                    <span style={{
                                        padding: "2px 8px",
                                        borderRadius: "4px",
                                        fontSize: "10px",
                                        fontWeight: 600,
                                        color: "white",
                                        background: prio.color,
                                    }}>
                                        {prio.label}
                                    </span>
                                    <button
                                        onClick={() => onRemoveTodo(task.id)}
                                        style={{ padding: "2px 8px", border: "none", borderRadius: "4px", cursor: "pointer", background: DiscordColors.danger, color: "white", fontSize: "11px" }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ padding: "10px", textAlign: "center", color: DiscordColors.textMuted, fontSize: "13px" }}>
                        Aucune tâche. Ajoute ta première tâche ci-dessus 👆
                    </div>
                )}
            </div>

            {/* Reminders */}
            <div style={CardStyles.card}>
                <h4 style={CardStyles.cardTitle}>⏰ Reminders ({reminders.length})</h4>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                    <input
                        style={{ ...InputStyles.text, flex: 1, minWidth: "180px" }}
                        placeholder="Texte du rappel..."
                        value={reminderText}
                        onChange={(e) => setReminderText(e.target.value)}
                        onKeyUp={(e) => { if (e.key === "Enter") handleAddReminder(); }}
                    />
                    <input
                        type="number"
                        min={1}
                        max={10080}
                        style={{ ...InputStyles.text, width: "80px" }}
                        value={reminderMinutes}
                        onChange={(e) => setReminderMinutes(e.target.value)}
                    />
                    <button onClick={handleAddReminder} disabled={!reminderText.trim()} style={ButtonStyles.primary}>
                        ➕ Dans X min
                    </button>
                </div>
                {reminders.length > 0 ? (
                    <div style={ListStyles.items}>
                        {reminders.map((reminder) => (
                            <div
                                key={reminder.id}
                                style={{ ...ListStyles.item, display: "flex", alignItems: "center", gap: "10px" }}
                            >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: "13px", color: DiscordColors.textNormal }}>{reminder.text}</div>
                                    <div style={{ fontSize: "11px", color: DiscordColors.textMuted }}>
                                        🔔 {new Date(reminder.dueAt).toLocaleTimeString()}
                                        {reminder.repeatMinutes > 0 ? ` · répétition toutes les ${reminder.repeatMinutes} min` : ""}
                                    </div>
                                </div>
                                <button
                                    onClick={() => onRemoveReminder(reminder.id)}
                                    style={{ padding: "2px 8px", border: "none", borderRadius: "4px", cursor: "pointer", background: DiscordColors.danger, color: "white", fontSize: "11px" }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: "10px", textAlign: "center", color: DiscordColors.textMuted, fontSize: "13px" }}>
                        Aucun reminder actif. Les rappels arrivent via toast toutes les 30 s.
                    </div>
                )}
            </div>

            {/* Security — PasscodeLock */}
            <div style={CardStyles.card}>
                <h4 style={CardStyles.cardTitle}>🔒 Verrouillage client (PasscodeLock)</h4>
                <p style={{ fontSize: "12px", color: DiscordColors.textMuted, margin: "0 0 10px 0" }}>
                    Code de 4 à 8 chiffres. Au démarrage de Discord, un overlay plein écran demande le code.
                    Mot de passe oublié : désactive EGO TOOL puis réactive-le après avoir nettoyé le réglage.
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div style={{ fontSize: "14px", color: DiscordColors.textNormal }}>
                        Verrouiller au démarrage
                    </div>
                    <div style={SwitchStyles.container}>
                        <label style={SwitchStyles.label}>
                            <input
                                type="checkbox"
                                checked={passcodeEnabled}
                                onChange={(e) => onSetPasscodeEnabled(e.target.checked)}
                                style={SwitchStyles.input}
                            />
                            <span style={SwitchStyles.slider} />
                        </label>
                    </div>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <input
                        type="password"
                        inputMode="numeric"
                        maxLength={8}
                        placeholder="Nouveau code (4-8 chiffres)"
                        style={{ ...InputStyles.text, width: "210px" }}
                        value={passcodeInput}
                        onChange={(e) => setPasscodeInput(e.target.value)}
                    />
                    <button onClick={handleSetPasscode} disabled={passcodeInput.trim().length < 4} style={ButtonStyles.primary}>
                        💾 Définir / modifier
                    </button>
                    <button onClick={() => { onSetPasscode(null); setPasscodeInput(""); }} style={ButtonStyles.danger}>
                        Supprimer le code
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductivityPanel;
