import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Github, Slack, CheckCircle2, AlertCircle, Zap, Info, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const ClickUpIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className} 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M5.385 13.911c.712-.511 1.631-.692 2.508-.491a4.341 4.341 0 011.696.864c.25.196.486.417.702.659.394.437.494.675 1.115.675.621 0 .721-.238 1.115-.675.216-.242.452-.463.702-.659a4.341 4.341 0 011.696-.864 3.737 3.737 0 012.508.491.439.439 0 01-.013.738l-4.706 3.124a1.295 1.295 0 01-1.42 0l-4.706-3.124a.439.439 0 01-.01-.738zM2.512 8.44l8.369-5.753c.677-.465 1.56-.465 2.237 0l8.369 5.753c.697.479.79 1.455.204 2.052l-2.008 2.049a.439.439 0 01-.637-.015l-4.108-4.223a.439.439 0 00-.731.314v8.834a.439.439 0 01-.439.439h-3.536a.439.439 0 01-.439-.439V8.911a.439.439 0 00-.731-.314l-4.108 4.223a.439.439 0 01-.637.015l-2.008-2.049c-.586-.597-.493-1.573.204-2.052z" />
  </svg>
);

export default function Automation() {
  const backendBase = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const [searchParams] = useSearchParams();
  const [connections, setConnections] = useState({
    github: false,
    clickup: false,
    slack: false
  });
  const [profileId, setProfileId] = useState<string>(localStorage.getItem("profileId") || "");
  const [projectId, setProjectId] = useState<string>(localStorage.getItem("projectId") || "");
  const [repos, setRepos] = useState<Array<{ fullName: string; owner: string; name: string }>>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [linkedRepo, setLinkedRepo] = useState<string>("");
  const [newRepoName, setNewRepoName] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  // ── Slack state ────────────────────────────────────────────
  const [slackChannels, setSlackChannels] = useState<Array<{ slackChannelId: string; name: string }>>([]);
  const [selectedSlackChannel, setSelectedSlackChannel] = useState<string>("");
  const [slackWorkspace, setSlackWorkspace] = useState<string>("");
  const [slackSelectedChannelName, setSlackSelectedChannelName] = useState<string>("");

  // ── ClickUp state ──────────────────────────────────────────
  const [clickupWorkspaceName, setClickupWorkspaceName] = useState<string>("");
  const [clickupWorkspaces, setClickupWorkspaces] = useState<Array<{ id: string; name: string }>>([]);
  const [clickupSpaces, setClickupSpaces] = useState<Array<{ id: string; name: string }>>([]);
  const [clickupFolders, setClickupFolders] = useState<Array<{ id: string; name: string }>>([]);
  const [clickupLists, setClickupLists] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [selectedSpace, setSelectedSpace] = useState<string>("");
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [selectedList, setSelectedList] = useState<string>("");
  const [clickupLinkedList, setClickupLinkedList] = useState<string>("");
  const [pushSprintName, setPushSprintName] = useState<string>("");
  const [showPushModal, setShowPushModal] = useState(false);

  const integrations = [
    { id: "github", name: "GitHub", desc: "Push scaffolded code directly to your repositories.", icon: Github },
    { id: "clickup", name: "ClickUp", desc: "Push sprints and tasks to your ClickUp Workspace.", icon: ClickUpIcon },
    { id: "slack", name: "Slack", desc: "Receive real-time notifications for architecture changes.", icon: Slack }
  ];

  // ── GitHub helpers ─────────────────────────────────────────

  const loadGitHubState = async (currentProfileId: string, currentProjectId: string) => {
    if (!currentProfileId) {
      setConnections((prev) => ({ ...prev, github: false }));
      setRepos([]);
      return;
    }

    try {
      const connectionRes = await fetch(`${backendBase}/api/github/connection?profileId=${encodeURIComponent(currentProfileId)}`);
      if (!connectionRes.ok) {
        const err = await connectionRes.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to load GitHub connection state.");
      }
      const connectionData = await connectionRes.json();
      const connected = Boolean(connectionData?.connected);

      setConnections((prev) => ({ ...prev, github: connected }));

      if (connected) {
        const reposRes = await fetch(`${backendBase}/api/github/repos?profileId=${encodeURIComponent(currentProfileId)}`);
        if (!reposRes.ok) {
          const err = await reposRes.json().catch(() => ({}));
          throw new Error(err?.error || "Failed to load repositories.");
        }
        const reposData = await reposRes.json();
        const list = (reposData?.repos || []).map((r: any) => ({
          fullName: r.fullName,
          owner: r.owner,
          name: r.name,
        }));
        setRepos(list);
      } else {
        setRepos([]);
      }

      if (currentProjectId) {
        const mappingRes = await fetch(`${backendBase}/api/github/projects/${currentProjectId}/link-repo`);
        const mappingData = await mappingRes.json();
        const fullName = mappingData?.mapping?.fullName || "";
        setLinkedRepo(fullName);
        if (fullName) {
          setSelectedRepo(fullName);
        }
      }
    } catch (error) {
      console.error(error);
      setConnections((prev) => ({ ...prev, github: false }));
      setRepos([]);
    }
  };

  // ── Slack helpers ──────────────────────────────────────────

  const loadSlackState = async (currentProfileId: string) => {
    if (!currentProfileId) {
      setConnections((prev) => ({ ...prev, slack: false }));
      setSlackChannels([]);
      return;
    }

    try {
      const res = await fetch(`${backendBase}/api/slack/connection?profileId=${encodeURIComponent(currentProfileId)}`);
      if (!res.ok) return;
      const data = await res.json();
      const connected = Boolean(data?.connected);

      setConnections((prev) => ({ ...prev, slack: connected }));
      setSlackWorkspace(data?.connection?.workspaceName || "");
      setSlackSelectedChannelName(data?.connection?.channelName || "");
      if (data?.connection?.channelId) {
        setSelectedSlackChannel(data.connection.channelId);
      }

      if (connected) {
        try {
          const chRes = await fetch(`${backendBase}/api/slack/channels?profileId=${encodeURIComponent(currentProfileId)}`);
          if (chRes.ok) {
            const chData = await chRes.json();
            setSlackChannels(chData?.channels || []);
          }
        } catch {
          // silently ignore channel fetch errors
        }
      }
    } catch {
      setConnections((prev) => ({ ...prev, slack: false }));
    }
  };

  const connectSlack = async () => {
    if (!profileId) {
      toast({ title: "Profile missing", description: "Login required to connect Slack.", variant: "destructive" });
      return;
    }

    const res = await fetch(`${backendBase}/api/slack/oauth/start?profileId=${encodeURIComponent(profileId)}`);
    const data = await res.json();

    if (!res.ok || !data?.url) {
      throw new Error(data?.error || "Failed to start Slack OAuth flow.");
    }

    window.location.href = data.url;
  };

  const selectSlackChannel = async (channelId: string) => {
    setSelectedSlackChannel(channelId);
    const channelObj = slackChannels.find((c) => c.slackChannelId === channelId);
    const channelName = channelObj?.name || channelId;
    setSlackSelectedChannelName(channelName);

    const res = await fetch(`${backendBase}/api/slack/channel/select`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, channelId, channelName }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "Failed to select channel.");
    }
  };

  const testSlack = async () => {
    const res = await fetch(`${backendBase}/api/slack/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, channel: selectedSlackChannel }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to send test message.");
    return data;
  };

  const disconnectSlack = async () => {
    const res = await fetch(`${backendBase}/api/slack/disconnect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to disconnect Slack.");

    setConnections((prev) => ({ ...prev, slack: false }));
    setSlackChannels([]);
    setSelectedSlackChannel("");
    setSlackWorkspace("");
    setSlackSelectedChannelName("");
  };

  // ── ClickUp helpers ────────────────────────────────────────

  const loadClickUpState = async (currentProfileId: string) => {
    if (!currentProfileId) {
      setConnections((prev) => ({ ...prev, clickup: false }));
      return;
    }

    try {
      const res = await fetch(`${backendBase}/api/clickup/connection?profileId=${encodeURIComponent(currentProfileId)}`);
      if (!res.ok) return;
      const data = await res.json();
      const connected = Boolean(data?.connected);

      setConnections((prev) => ({ ...prev, clickup: connected }));
      setClickupWorkspaceName(data?.connection?.workspaceName || "");

      if (connected) {
        try {
          const wRes = await fetch(`${backendBase}/api/clickup/workspaces?profileId=${encodeURIComponent(currentProfileId)}`);
          if (wRes.ok) {
            const wData = await wRes.json();
            setClickupWorkspaces(wData?.workspaces || []);
          }
        } catch { /* ignore */ }
      }
    } catch {
      setConnections((prev) => ({ ...prev, clickup: false }));
    }
  };

  const connectClickUp = async () => {
    if (!profileId) {
      toast({ title: "Profile missing", description: "Login required to connect ClickUp.", variant: "destructive" });
      return;
    }

    const params = new URLSearchParams({ profileId });
    // removed projectId from oauth start since it causes state size issues

    window.location.href = `${backendBase}/api/clickup/oauth/start?${params.toString()}`;
  };

  const handleDisconnectClickUp = async () => {
    const res = await fetch(`${backendBase}/api/clickup/disconnect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to disconnect ClickUp.");

    setConnections((prev) => ({ ...prev, clickup: false }));
    setClickupWorkspaces([]);
    setClickupSpaces([]);
    setClickupFolders([]);
    setClickupLists([]);
    setSelectedWorkspace("");
    setSelectedSpace("");
    setSelectedFolder("");
    setSelectedList("");
    setClickupWorkspaceName("");
    setClickupLinkedList("");
  };

  const loadClickUpSpaces = async (workspaceId: string) => {
    setSelectedWorkspace(workspaceId);
    setClickupSpaces([]);
    setClickupFolders([]);
    setClickupLists([]);
    setSelectedSpace("");
    setSelectedFolder("");
    setSelectedList("");
    try {
      const res = await fetch(`${backendBase}/api/clickup/spaces?profileId=${encodeURIComponent(profileId)}&workspaceId=${encodeURIComponent(workspaceId)}`);
      if (res.ok) {
        const data = await res.json();
        setClickupSpaces(data?.spaces || []);
      }
    } catch (e) { console.error("Failed to load spaces", e); }
  };

  const loadClickUpFolders = async (spaceId: string) => {
    setSelectedSpace(spaceId);
    setClickupFolders([]);
    setClickupLists([]);
    setSelectedFolder("");
    setSelectedList("");
    try {
      const res = await fetch(`${backendBase}/api/clickup/folders?profileId=${encodeURIComponent(profileId)}&spaceId=${encodeURIComponent(spaceId)}`);
      if (res.ok) {
        const data = await res.json();
        setClickupFolders(data?.folders || []);
      }
    } catch (e) { console.error("Failed to load folders", e); }
    // Also load folderless lists
    try {
      const res = await fetch(`${backendBase}/api/clickup/lists?profileId=${encodeURIComponent(profileId)}&spaceId=${encodeURIComponent(spaceId)}`);
      if (res.ok) {
        const data = await res.json();
        setClickupLists(data?.lists || []);
      }
    } catch (e) { console.error("Failed to load lists", e); }
  };

  const loadClickUpLists = async (folderId: string) => {
    setSelectedFolder(folderId);
    setClickupLists([]);
    setSelectedList("");
    try {
      const res = await fetch(`${backendBase}/api/clickup/lists?profileId=${encodeURIComponent(profileId)}&spaceId=${encodeURIComponent(selectedSpace)}&folderId=${encodeURIComponent(folderId)}`);
      if (res.ok) {
        const data = await res.json();
        setClickupLists(data?.lists || []);
      }
    } catch (e) { console.error("Failed to load lists", e); }
  };

  const linkClickUpListAction = async () => {
    if (!projectId) throw new Error("Upload PRD first so projectId exists.");
    if (!selectedList) throw new Error("Select a list first.");

    const listObj = clickupLists.find(l => l.id === selectedList);
    const res = await fetch(`${backendBase}/api/clickup/link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId,
        projectId,
        workspaceId: selectedWorkspace,
        spaceId: selectedSpace,
        folderId: selectedFolder || undefined,
        listId: selectedList,
        listName: listObj?.name,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to link list.");
    setClickupLinkedList(listObj?.name || selectedList);
  };

  const pushSprintToClickUp = async () => {
    if (!projectId) throw new Error("Upload PRD first so projectId exists.");
    if (!selectedWorkspace || !selectedSpace || !pushSprintName.trim()) {
      throw new Error("Select workspace, space, and enter a sprint name.");
    }

    const res = await fetch(`${backendBase}/api/clickup/push-sprint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId,
        projectId,
        workspaceId: selectedWorkspace,
        spaceId: selectedSpace,
        folderId: selectedFolder || undefined,
        sprintName: pushSprintName.trim(),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to push sprint.");
    setShowPushModal(false);
    setPushSprintName("");
    return data;
  };

  // ── Init ───────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      const queryProfileId = searchParams.get("profileId") || "";
      const queryProjectId = searchParams.get("projectId") || "";
      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id || "";
      const storedProfileId = localStorage.getItem("profileId") || "";
      const effectiveProfileId = queryProfileId || userId || storedProfileId;

      if (effectiveProfileId) {
        setProfileId(effectiveProfileId);
        localStorage.setItem("profileId", effectiveProfileId);
      }

      // Restore projectId from OAuth redirect URL if present
      const effectiveProjectId = queryProjectId || projectId;
      if (queryProjectId && queryProjectId !== projectId) {
        setProjectId(queryProjectId);
        localStorage.setItem("projectId", queryProjectId);
      }

      await loadGitHubState(effectiveProfileId, effectiveProjectId);
      await loadSlackState(effectiveProfileId);
      await loadClickUpState(effectiveProfileId);

      // Handle post-OAuth redirects
      const githubParam = searchParams.get("github");
      if (githubParam === "connected") {
        toast({ title: "GitHub connected", description: "Your GitHub account is now connected." });
      } else if (githubParam === "error") {
        toast({ title: "GitHub error", description: searchParams.get("message") || "OAuth failed.", variant: "destructive" });
      }

      const clickupParam = searchParams.get("clickup");
      if (clickupParam === "connected") {
        toast({ title: "ClickUp connected", description: "Your ClickUp workspace is now connected." });
      } else if (clickupParam === "error") {
        toast({ title: "ClickUp error", description: searchParams.get("message") || "OAuth failed.", variant: "destructive" });
      }

      const slackParam = searchParams.get("slack");
      if (slackParam === "connected") {
        toast({ title: "Slack connected", description: "Your Slack workspace is now connected." });
      } else if (slackParam === "error") {
        toast({ title: "Slack error", description: searchParams.get("message") || "OAuth failed.", variant: "destructive" });
      }
    };

    init();
  }, [projectId, searchParams]);

  const selectedRepoParts = useMemo(() => {
    if (!selectedRepo.includes("/")) {
      return { owner: "", repo: "" };
    }
    const [owner, repo] = selectedRepo.split("/");
    return { owner, repo };
  }, [selectedRepo]);

  // ── GitHub card actions ────────────────────────────────────

  const connectGitHub = async () => {
    if (!profileId) {
      toast({
        title: "Profile missing",
        description: "Login required to connect GitHub.",
        variant: "destructive",
      });
      return;
    }

    const params = new URLSearchParams({ profileId });
    if (projectId) {
      params.set("projectId", projectId);
    }

    const res = await fetch(`${backendBase}/api/github/oauth/start?${params.toString()}`);
    const data = await res.json();

    if (!res.ok || !data?.url) {
      throw new Error(data?.error || "Failed to start GitHub OAuth flow.");
    }

    window.location.href = data.url;
  };

  const createRepo = async () => {
    if (!newRepoName.trim()) {
      throw new Error("Enter repository name first.");
    }

    const res = await fetch(`${backendBase}/api/github/repos/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId,
        name: newRepoName.trim(),
        isPrivate: true,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || "Failed to create repository.");
    }

    const fullName = data?.repo?.fullName;
    if (fullName) {
      setSelectedRepo(fullName);
      setNewRepoName("");
    }

    await loadGitHubState(profileId, projectId);
  };

  const linkRepo = async () => {
    if (!projectId) {
      throw new Error("Upload PRD first so projectId exists.");
    }
    if (!selectedRepoParts.owner || !selectedRepoParts.repo) {
      throw new Error("Select a repository first.");
    }

    const res = await fetch(`${backendBase}/api/github/projects/${projectId}/link-repo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId,
        owner: selectedRepoParts.owner,
        repo: selectedRepoParts.repo,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || "Failed to link repository.");
    }

    setLinkedRepo(data?.mapping?.fullName || `${selectedRepoParts.owner}/${selectedRepoParts.repo}`);
  };

  const pushProject = async () => {
    if (!projectId) {
      throw new Error("Upload PRD first so projectId exists.");
    }

    const raw = localStorage.getItem("generatedCodeFiles");
    const files = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(files) || files.length === 0) {
      throw new Error("No generated files found. Open Code Generator once before pushing.");
    }

    const res = await fetch(`${backendBase}/api/github/projects/${projectId}/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        files,
        commitMessage: "feat: sync project from blueprint dashboard",
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || "Failed to push project.");
    }

    toast({
      title: "Pushed to GitHub",
      description: `Commit ${data?.commitSha || "created"}`,
    });
  };

  // ── Toggle handler ─────────────────────────────────────────

  const handleToggle = (id: string) => {
    const nextState = !connections[id as keyof typeof connections];

    if (id === "github") {
      if (!nextState) {
        toast({ title: "GitHub stays connected", description: "Disconnect flow is not enabled yet." });
        return;
      }
      setBusy(true);
      connectGitHub()
        .catch((error: any) => toast({ title: "GitHub connect failed", description: error.message, variant: "destructive" }))
        .finally(() => setBusy(false));
      return;
    }

    if (id === "clickup") {
      if (nextState) {
        setBusy(true);
        connectClickUp()
          .catch((error: any) => toast({ title: "ClickUp connect failed", description: error.message, variant: "destructive" }))
          .finally(() => setBusy(false));
      } else {
        setBusy(true);
        handleDisconnectClickUp()
          .then(() => toast({ title: "ClickUp disconnected" }))
          .catch((error: any) => toast({ title: "ClickUp disconnect failed", description: error.message, variant: "destructive" }))
          .finally(() => setBusy(false));
      }
      return;
    }

    if (id === "slack") {
      if (nextState) {
        setBusy(true);
        connectSlack()
          .catch((error: any) => toast({ title: "Slack connect failed", description: error.message, variant: "destructive" }))
          .finally(() => setBusy(false));
      } else {
        setBusy(true);
        disconnectSlack()
          .then(() => toast({ title: "Slack disconnected" }))
          .catch((error: any) => toast({ title: "Slack disconnect failed", description: error.message, variant: "destructive" }))
          .finally(() => setBusy(false));
      }
      return;
    }
  };

  // ── Render ─────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Zap className="w-8 h-8 text-primary" />
            Automations &amp; Integrations
          </h1>
          <p className="text-zinc-400 mt-1">Connect your workspace to your engineering stack to sync code and tasks seamlessly.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((int) => {
          const isConnected = connections[int.id as keyof typeof connections];
          return (
            <Card key={int.id} className={cn("bg-zinc-900 border transition-all duration-300", isConnected ? "border-primary/30 shadow-[0_0_15px_rgba(249,115,22,0.05)]" : "border-zinc-800")}>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors", isConnected ? "bg-primary/10 text-primary" : "bg-zinc-950 text-zinc-500")}>
                    <int.icon className="w-6 h-6" />
                  </div>
                  <Switch 
                    checked={isConnected} 
                    onCheckedChange={() => handleToggle(int.id)}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
                <CardTitle className="text-white text-xl">{int.name}</CardTitle>
                <CardDescription className="text-zinc-400 mt-2 h-10 leading-relaxed text-sm">{int.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                  {isConnected ? (
                    <div className="flex items-center gap-2 text-sm text-green-400 font-medium">
                      <CheckCircle2 className="w-4 h-4 animate-pulse" /> 
                      Connected
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <AlertCircle className="w-4 h-4" /> 
                      Not connected
                    </div>
                  )}
                  {isConnected && (
                    <Badge variant="outline" className="text-[10px] uppercase border-primary/20 bg-primary/5 text-primary">Active</Badge>
                  )}
                </div>

                {/* ── GitHub card body ── */}
                {int.id === "github" && (
                  <div className="mt-4 space-y-3">
                    <div className="text-xs text-zinc-500 break-all">projectId: {projectId || "(missing)"}</div>
                    <div className="text-xs text-zinc-500 break-all">linked: {linkedRepo || "(not linked)"}</div>

                    <div className="space-y-2">
                      <Label className="text-zinc-300">Select repository</Label>
                      <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                        <SelectTrigger className="bg-zinc-950 border-zinc-700 text-zinc-200">
                          <SelectValue placeholder="Choose repo" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                          {repos.length === 0 && (
                            <div className="px-2 py-2 text-xs text-zinc-400">No repositories found for this GitHub account.</div>
                          )}
                          {repos.map((repo) => (
                            <SelectItem key={repo.fullName} value={repo.fullName}>
                              {repo.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="new repo name"
                        value={newRepoName}
                        onChange={(e) => setNewRepoName(e.target.value)}
                        className="bg-zinc-950 border-zinc-700 text-zinc-100"
                      />
                      <Button disabled={busy || !connections.github} onClick={() => {
                        setBusy(true);
                        createRepo()
                          .then(() => toast({ title: "Repository created" }))
                          .catch((error: any) => toast({ title: "Create repo failed", description: error.message, variant: "destructive" }))
                          .finally(() => setBusy(false));
                      }}>
                        Create
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button className="w-full" disabled={busy || !connections.github || !selectedRepo} onClick={() => {
                        setBusy(true);
                        linkRepo()
                          .then(() => toast({ title: "Repository linked" }))
                          .catch((error: any) => toast({ title: "Link failed", description: error.message, variant: "destructive" }))
                          .finally(() => setBusy(false));
                      }}>
                        Link Repo
                      </Button>
                      <Button className="w-full" disabled={busy || !connections.github || !linkedRepo} onClick={() => {
                        setBusy(true);
                        pushProject()
                          .catch((error: any) => toast({ title: "Push failed", description: error.message, variant: "destructive" }))
                          .finally(() => setBusy(false));
                      }}>
                        Push
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── ClickUp card body ── */}
                {int.id === "clickup" && connections.clickup && (
                  <div className="mt-4 space-y-3">
                    <div className="text-xs text-zinc-500 break-all">workspace: {clickupWorkspaceName || "(unknown)"}</div>
                    <div className="text-xs text-zinc-500 break-all">linked list: {clickupLinkedList || "(not linked)"}</div>

                    <div className="space-y-2">
                      <Label className="text-zinc-300">Workspace</Label>
                      <Select value={selectedWorkspace} onValueChange={(val) => { loadClickUpSpaces(val); }}>
                        <SelectTrigger className="bg-zinc-950 border-zinc-700 text-zinc-200">
                          <SelectValue placeholder="Choose workspace" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                          {clickupWorkspaces.length === 0 && (
                            <div className="px-2 py-2 text-xs text-zinc-400">No workspaces found.</div>
                          )}
                          {clickupWorkspaces.map((w) => (
                            <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedWorkspace && (
                      <div className="space-y-2">
                        <Label className="text-zinc-300">Space</Label>
                        <Select value={selectedSpace} onValueChange={(val) => { loadClickUpFolders(val); }}>
                          <SelectTrigger className="bg-zinc-950 border-zinc-700 text-zinc-200">
                            <SelectValue placeholder="Choose space" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                            {clickupSpaces.length === 0 && (
                              <div className="px-2 py-2 text-xs text-zinc-400">No spaces found.</div>
                            )}
                            {clickupSpaces.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedSpace && clickupFolders.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-zinc-300">Folder <span className="text-zinc-500">(optional)</span></Label>
                        <Select value={selectedFolder} onValueChange={(val) => { loadClickUpLists(val); }}>
                          <SelectTrigger className="bg-zinc-950 border-zinc-700 text-zinc-200">
                            <SelectValue placeholder="Choose folder (optional)" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                            {clickupFolders.map((f) => (
                              <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedSpace && clickupLists.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-zinc-300">List</Label>
                        <Select value={selectedList} onValueChange={setSelectedList}>
                          <SelectTrigger className="bg-zinc-950 border-zinc-700 text-zinc-200">
                            <SelectValue placeholder="Choose list" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                            {clickupLists.map((l) => (
                              <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button className="w-full" disabled={busy || !selectedList} onClick={() => {
                        setBusy(true);
                        linkClickUpListAction()
                          .then(() => toast({ title: "List linked" }))
                          .catch((error: any) => toast({ title: "Link failed", description: error.message, variant: "destructive" }))
                          .finally(() => setBusy(false));
                      }}>
                        Link List
                      </Button>
                    </div>

                    {/* Push Sprint */}
                    {showPushModal ? (
                      <div className="space-y-2 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                        <Label className="text-zinc-300">Sprint Name</Label>
                        <Input
                          placeholder="e.g. Sprint 1"
                          value={pushSprintName}
                          onChange={(e) => setPushSprintName(e.target.value)}
                          className="bg-zinc-900 border-zinc-700 text-zinc-100"
                        />
                        <div className="flex gap-2">
                          <Button className="w-full bg-primary" disabled={busy || !pushSprintName.trim() || !selectedWorkspace || !selectedSpace} onClick={() => {
                            setBusy(true);
                            pushSprintToClickUp()
                              .then((data) => toast({ title: "Sprint pushed!", description: `${data?.createdTasks || 0} tasks created in ClickUp.` }))
                              .catch((error: any) => toast({ title: "Push failed", description: error.message, variant: "destructive" }))
                              .finally(() => setBusy(false));
                          }}>
                            Push Sprint
                          </Button>
                          <Button variant="outline" className="border-zinc-700 text-zinc-400" onClick={() => { setShowPushModal(false); setPushSprintName(""); }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="outline" className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10" disabled={busy || !selectedWorkspace || !selectedSpace} onClick={() => setShowPushModal(true)}>
                        Push Sprint to ClickUp
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      className="w-full border-red-800/30 text-red-400 hover:bg-red-950/20"
                      disabled={busy}
                      onClick={() => {
                        setBusy(true);
                        handleDisconnectClickUp()
                          .then(() => toast({ title: "ClickUp disconnected" }))
                          .catch((error: any) => toast({ title: "Disconnect failed", description: error.message, variant: "destructive" }))
                          .finally(() => setBusy(false));
                      }}
                    >
                      Disconnect
                    </Button>
                  </div>
                )}

                {/* ── Slack card body ── */}
                {int.id === "slack" && connections.slack && (
                  <div className="mt-4 space-y-3">
                    <div className="text-xs text-zinc-500 break-all">
                      workspace: {slackWorkspace || "(unknown)"}
                    </div>
                    <div className="text-xs text-zinc-500 break-all">
                      channel: {slackSelectedChannelName || "(none selected)"}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-zinc-300">Select channel</Label>
                      <Select value={selectedSlackChannel} onValueChange={(val) => {
                        setBusy(true);
                        selectSlackChannel(val)
                          .then(() => toast({ title: "Channel selected" }))
                          .catch((error: any) => toast({ title: "Channel select failed", description: error.message, variant: "destructive" }))
                          .finally(() => setBusy(false));
                      }}>
                        <SelectTrigger className="bg-zinc-950 border-zinc-700 text-zinc-200">
                          <SelectValue placeholder="Choose channel" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                          {slackChannels.length === 0 && (
                            <div className="px-2 py-2 text-xs text-zinc-400">No channels found. Invite the bot to channels first.</div>
                          )}
                          {slackChannels.map((ch) => (
                            <SelectItem key={ch.slackChannelId} value={ch.slackChannelId}>
                              #{ch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="w-full"
                        disabled={busy || !selectedSlackChannel}
                        onClick={() => {
                          setBusy(true);
                          testSlack()
                            .then(() => toast({ title: "Test message sent", description: "Check your Slack channel." }))
                            .catch((error: any) => toast({ title: "Test failed", description: error.message, variant: "destructive" }))
                            .finally(() => setBusy(false));
                        }}
                      >
                        Send Test
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-red-800/30 text-red-400 hover:bg-red-950/20"
                        disabled={busy}
                        onClick={() => {
                          setBusy(true);
                          disconnectSlack()
                            .then(() => toast({ title: "Slack disconnected" }))
                            .catch((error: any) => toast({ title: "Disconnect failed", description: error.message, variant: "destructive" }))
                            .finally(() => setBusy(false));
                        }}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

    </DashboardLayout>
  );
}