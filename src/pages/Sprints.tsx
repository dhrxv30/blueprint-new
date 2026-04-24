// src/pages/Sprints.tsx
import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowRight,
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  CircleDashed,
  GripVertical,
  BookOpen,
  RefreshCcw,
  X,
  ListTodo,
  Edit,
  Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BACKEND_BASE } from "@/lib/config";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Task {
  id: string;
  title: string;
  status: string; // 'todo' | 'in-progress' | 'done'
  priority: string;
  type: string;
  points: number;
  story: string;
  assignee: string;
  description?: string;
}

export default function Sprints() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Task Dialog States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskData, setNewTaskData] = useState<Partial<Task>>({
    title: "",
    description: "",
    priority: "Medium",
    type: "Backend",
    points: 3,
    status: "todo",
    story: "Manual Task"
  });

  // --- DATA LOADING ---
  useEffect(() => {
    const fetchSprints = async () => {
      try {
        let aiTasks = [];
        let aiStories = [];

        if (projectId) {
          const response = await fetch(`${BACKEND_BASE}/api/projects/${projectId}/analysis`);
          if (response.ok) {
            const analysis = await response.json();
            aiTasks = Array.isArray(analysis.tasks) ? analysis.tasks : [];
            aiStories = Array.isArray(analysis.stories) ? analysis.stories : [];
          }
        }

        if (aiTasks.length === 0) {
          const raw = localStorage.getItem("blueprint_project_data");
          if (raw) {
            const data = JSON.parse(raw);
            aiTasks = data.tasks || [];
            aiStories = data.stories || [];
          }
        }

        // Map AI tasks to the Kanban board structure
        const formattedTasks = aiTasks.map((t: any, i: number) => {
          // Find the parent user story for context
          const parentStory = aiStories.find((s: any) => s.id === t.storyId);

          return {
            id: t.id || t.taskId || `TSK-${i + 1}`,
            title: t.title || t.name || t.task || "Untitled Task",
            status: t.status || 'todo', // Default everything to the first column
            priority: t.priority || 'Medium',
            type: t.type || 'Backend',
            points: t.points || t.storyPoints || 3,
            story: parentStory ? (parentStory.title || parentStory.name) : "General Architecture",
            // Mock assignees for UI aesthetics
            assignee: t.assignee || ['Alex', 'Sarah', 'Mike', 'David'][i % 4] 
          };
        });

        setTasks(formattedTasks);
      } catch (e) {
        console.error("Error loading task data", e);
      }
    };

    fetchSprints();
  }, [projectId]);

  // --- FILTERING ---
  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks;
    const query = searchQuery.toLowerCase();
    return tasks.filter(task =>
      task.id.toLowerCase().includes(query) ||
      task.title.toLowerCase().includes(query) ||
      task.priority.toLowerCase() === query ||
      task.story.toLowerCase().includes(query) ||
      task.type.toLowerCase().includes(query)
    );
  }, [tasks, searchQuery]);

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setIsDragging(false);
    if (!draggedTaskId) return;

    // Update local state instantly for UI
    setTasks(prev => prev.map(t => t.id === draggedTaskId ? { ...t, status: newStatus } : t));
    
    // Persist to backend
    if (projectId) {
      try {
        await fetch(`${BACKEND_BASE}/api/projects/${projectId}/tasks/${draggedTaskId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
      } catch (err) {
        console.error("Failed to update task status on server", err);
      }

      // Also sync to ClickUp if linked
      const profileId = localStorage.getItem("profileId") || "";
      if (profileId) {
        try {
          await fetch(`http://localhost:5000/api/clickup/sync-task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profileId, projectId, localTaskId: draggedTaskId, status: newStatus })
          });
        } catch {
          // Silently ignore — ClickUp may not be linked
        }
      }
    }
    
    setDraggedTaskId(null);
    
  }, [draggedTaskId, projectId]);

  // --- TASK ACTIONS ---
  const handleSaveNewTask = async () => {
    if (!newTaskData.title) return;
    try {
      const res = await fetch(`${BACKEND_BASE}/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTaskData, assignee: "Me" })
      });
      if (res.ok) {
        const { task } = await res.json();
        setTasks(prev => [task, ...prev]);
        setIsAddModalOpen(false);
        toast({ title: "Task added", description: "Your manual task has been saved." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add task." });
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    try {
      const res = await fetch(`${BACKEND_BASE}/api/projects/${projectId}/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTask)
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t));
        setIsEditModalOpen(false);
        toast({ title: "Task updated", description: "Changes have been saved." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update task." });
    }
  };

  // --- UTILITY FUNCTIONS ---
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high": 
      case "critical": return "text-red-400 bg-red-500/10 border-red-500/20";
      case "medium": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      default: return "text-green-400 bg-green-500/10 border-green-500/20";
    }
  };

  const syncToClickUp = async () => {
    const profileId = localStorage.getItem("profileId") || "";
    if (!profileId) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to sync to ClickUp." });
      return;
    }

    try {
      toast({ title: "Syncing...", description: "Checking ClickUp connection." });
      
      // 1. Verify connection
      const statusRes = await fetch(`${BACKEND_BASE}/api/clickup/status?profileId=${profileId}`);
      const statusData = await statusRes.json();
      
      if (!statusData.isConnected) {
        toast({
          variant: "destructive",
          title: "ClickUp Not Linked",
          description: "Please connect your ClickUp workspace in Settings first.",
          action: (
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/settings")}>
              Go to Settings
            </Button>
          )
        });
        return;
      }

      // 2. Perform Sync using the modern push-sprint endpoint
      // Note: In a production flow, we would fetch these IDs from the user's mapping.
      // If they aren't set, we redirect to settings to establish them.
      const response = await fetch(`${BACKEND_BASE}/api/clickup/push-sprint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: projectId || "demo-project-123",
          profileId: profileId,
          sprintName: "Sprint 1",
          // Removing hardcoded IDs to let the backend handle defaults or mapping
          workspaceId: localStorage.getItem("clickup_workspace_id") || "",
          spaceId: localStorage.getItem("clickup_space_id") || ""
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const msg = errorData.error || "Sync failed";
        
        // Handle unauthorized / expired token
        if (msg.includes("401") || msg.includes("OAUTH")) {
          toast({
            variant: "destructive",
            title: "Re-authentication Required",
            description: "Your ClickUp session has expired or is unauthorized.",
            action: (
              <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/settings")}>
                Fix Connection
              </Button>
            )
          });
          return;
        }
        throw new Error(msg);
      }
      
      toast({ title: "Synced", description: "Tasks successfully pushed to ClickUp." });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: err.message || "Could not push tasks to ClickUp."
      });
    }
  };

  const renderTaskCard = (task: Task) => (
    <Card
      key={task.id}
      id={task.id}
      draggable
      onDragStart={(e) => handleDragStart(e, task.id)}
      className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all cursor-grab active:cursor-grabbing mb-3 group relative overflow-hidden"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.type?.toLowerCase() === 'infrastructure' ? 'bg-purple-500' : task.type?.toLowerCase() === 'frontend' ? 'bg-blue-500' : 'bg-orange-500'}`} />
      <CardContent className="p-4 pl-5">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-xs font-mono text-zinc-500">{task.id}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-zinc-500 hover:text-white -mr-2 -mt-2"
            onClick={(e) => {
              e.stopPropagation();
              setEditingTask(task);
              setIsEditModalOpen(true);
            }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
        <h3 className="text-sm font-medium text-white mb-2 leading-snug">{task.title}</h3>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-4 bg-zinc-950 w-fit px-2 py-1 rounded border border-zinc-800/80 line-clamp-1 max-w-full">
          <BookOpen className="w-3 h-3 text-blue-400 shrink-0" />
          <span className="truncate">{task.story}</span>
        </div>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-800/50">
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${getPriorityColor(task.priority)}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              task.priority?.toLowerCase() === 'high' || task.priority?.toLowerCase() === 'critical' ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]' :
              task.priority?.toLowerCase() === 'medium' ? 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]' :
              'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]'
            }`} />
            {task.priority?.toUpperCase()}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
              {task.points}
            </div>
            <Avatar className="w-6 h-6 border border-zinc-700">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee}`} />
              <AvatarFallback>{task.assignee?.substring(0, 1) || 'U'}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Tasks & Sprint Planner</h1>
          <p className="text-zinc-400 mt-1">Real-time board synced with your PRD analysis.</p>
        </div>
        <div className="flex gap-3">
          <Button
            className="bg-primary hover:brightness-110 text-primary-foreground gap-2 shadow-lg glow-orange h-10 px-6 rounded-xl font-bold"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-4 h-4" /> ADD TASK
          </Button>
          <Button
            variant="outline"
            className={`gap-2 transition-colors rounded-xl h-10 ${isFilterOpen ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:text-white'}`}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter className="w-4 h-4" /> {isFilterOpen ? "Hide Filters" : "Filter"}
          </Button>
          <Button
            variant="outline"
            className="bg-zinc-950 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 gap-2 rounded-xl h-10"
            onClick={syncToClickUp}
          >
            <RefreshCcw className="w-4 h-4" /> Push to ClickUp
          </Button>
        </div>
      </div>

      {isFilterOpen && (
        <Card className="bg-zinc-900 border-zinc-800 mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <CardContent className="p-4 flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search tasks, priorities, or stories..."
                className="pl-10 bg-zinc-950 border-zinc-800 text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* KANBAN BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-16rem)] min-h-[600px]">
        
        {/* TO DO COLUMN */}
        <div
          className="flex flex-col bg-zinc-950/50 rounded-xl border border-zinc-800/50 p-4"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'todo')}
        >
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <CircleDashed className="w-4 h-4 text-zinc-500" />
              To Do
            </h2>
            <span className="text-xs font-medium text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full">
              {filteredTasks.filter(t => t.status === 'todo').length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {filteredTasks.filter(t => t.status === 'todo').map(renderTaskCard)}
          </div>
        </div>

        {/* IN PROGRESS COLUMN */}
        <div
          className="flex flex-col bg-zinc-950/50 rounded-xl border border-zinc-800/50 p-4"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'in-progress')}
        >
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              In Progress
            </h2>
            <span className="text-xs font-medium text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full">
              {filteredTasks.filter(t => t.status === 'in-progress').length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {filteredTasks.filter(t => t.status === 'in-progress').map(renderTaskCard)}
          </div>
        </div>

        {/* DONE COLUMN */}
        <div
          className="flex flex-col bg-zinc-950/50 rounded-xl border border-zinc-800/50 p-4"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'done')}
        >
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Done
            </h2>
            <span className="text-xs font-medium text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full">
              {filteredTasks.filter(t => t.status === 'done').length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {filteredTasks.filter(t => t.status === 'done').map(renderTaskCard)}
          </div>
        </div>
      </div>

      {/* ADD TASK MODAL */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Add Manual Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Task Title</Label>
              <Input 
                className="bg-zinc-950 border-zinc-800"
                placeholder="Feature: Implement login sync"
                value={newTaskData.title}
                onChange={(e) => setNewTaskData({...newTaskData, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                className="bg-zinc-950 border-zinc-800 min-h-[100px]"
                placeholder="Details about implementation..."
                value={newTaskData.description}
                onChange={(e) => setNewTaskData({...newTaskData, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select onValueChange={(v) => setNewTaskData({...newTaskData, priority: v})} defaultValue="Medium">
                  <SelectTrigger className="bg-zinc-950 border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select onValueChange={(v) => setNewTaskData({...newTaskData, type: v})} defaultValue="Backend">
                  <SelectTrigger className="bg-zinc-950 border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="Frontend">Frontend</SelectItem>
                    <SelectItem value="Backend">Backend</SelectItem>
                    <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNewTask} className="bg-primary hover:brightness-110 text-white">Save Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT TASK MODAL */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task: {editingTask?.id}</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Task Title</Label>
                <Input 
                  className="bg-zinc-950 border-zinc-800"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select onValueChange={(v) => setEditingTask({...editingTask, priority: v})} defaultValue={editingTask.priority}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateTask} className="bg-primary hover:brightness-110 text-white">Update Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}
