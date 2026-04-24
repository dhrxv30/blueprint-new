import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Bell, Shield, Palette, Globe, CreditCard, Zap, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { BACKEND_BASE } from "@/lib/config";

const settingsSections = [
  {
    title: "Profile",
    description: "Manage your account details and preferences",
    icon: User,
    settings: [
      { label: "Display Name", value: "Engineering Team", type: "text" },
      { label: "Email", value: "team@blueprint.dev", type: "text" },
      { label: "Timezone", value: "UTC-8 (Pacific)", type: "text" },
    ],
  },
  {
    title: "Notifications",
    description: "Control how and when you receive alerts",
    icon: Bell,
    toggles: [
      { label: "Email notifications for task updates", defaultOn: true },
      { label: "Sprint completion alerts", defaultOn: true },
      { label: "PRD analysis ready notifications", defaultOn: false },
      { label: "Weekly digest summary", defaultOn: true },
    ],
  },
  {
    title: "Security",
    description: "Authentication and access control settings",
    icon: Shield,
    settings: [
      { label: "Two-Factor Authentication", value: "Enabled", type: "badge" },
      { label: "Session Timeout", value: "30 minutes", type: "text" },
      { label: "API Key", value: "bp_live_••••••••k7x9", type: "secret" },
    ],
  },
  {
    title: "Appearance",
    description: "Customize the look and feel of your workspace",
    icon: Palette,
    toggles: [
      { label: "Use system accent color", defaultOn: false },
      { label: "Reduce motion & animations", defaultOn: false },
      { label: "Compact sidebar navigation", defaultOn: false },
    ],
  },
];

const planDetails = {
  name: "Pro Plan",
  price: "$29/mo",
  features: ["Unlimited projects", "AI-powered analysis", "Priority support", "Custom integrations"],
};

export default function Settings() {
  const { toast } = useToast();
  const [profileName, setProfileName] = useState("Engineering Team");
  const [profileEmail, setProfileEmail] = useState("team@blueprint.dev");
  const [integrationStatus, setIntegrationStatus] = useState({
    github: false,
    clickup: false,
    slack: false,
    jira: false,
    linear: false
  });

  useEffect(() => {
    const loadUserAndIntegrations = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;

      setProfileName(user.user_metadata?.full_name || "Developer");
      setProfileEmail(user.email || "No email");

      try {
        const [githubRes, clickupRes] = await Promise.all([
          fetch(`${BACKEND_BASE}/api/github/connection?profileId=${encodeURIComponent(user.id)}`),
          fetch(`${BACKEND_BASE}/api/clickup/status?profileId=${encodeURIComponent(user.id)}`)
        ]);

        const githubData = githubRes.ok ? await githubRes.json() : {};
        const clickupData = clickupRes.ok ? await clickupRes.json() : {};

        setIntegrationStatus((prev) => ({
          ...prev,
          github: Boolean(githubData?.connected),
          clickup: Boolean(clickupData?.isConnected)
        }));
      } catch {
        // keep defaults if backend is unavailable
      }
    };

    loadUserAndIntegrations();
  }, []);

  const integrations = useMemo(() => ([
    { name: "GitHub", connected: integrationStatus.github },
    { name: "Jira", connected: integrationStatus.jira },
    { name: "Slack", connected: integrationStatus.slack },
    { name: "Linear", connected: integrationStatus.linear },
    { name: "ClickUp", connected: integrationStatus.clickup },
  ]), [integrationStatus]);

  const handleSave = () => {
    toast({ title: "Settings saved", description: "Your preferences have been updated successfully." });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-satoshi text-foreground">Settings</h1>
          <p className="text-text-secondary mt-1">Manage your workspace configuration and preferences.</p>
        </div>

        {/* Billing Card */}
        <Card className="bg-surface border-border-subtle overflow-hidden">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{planDetails.name}</h3>
                  <Badge className="bg-primary/15 text-primary border-0 text-xs">{planDetails.price}</Badge>
                </div>
                <p className="text-sm text-text-muted mt-0.5">
                  {planDetails.features.join(" · ")}
                </p>
              </div>
            </div>
            <Button variant="outline" className="border-border-emphasis text-foreground hover:bg-overlay">
              Manage Plan
            </Button>
          </div>
        </Card>

        {/* Settings Sections */}
        {settingsSections.map((section) => (
          <Card key={section.title} className="bg-surface border-border-subtle">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-elevated flex items-center justify-center">
                  <section.icon className="w-4.5 h-4.5 text-text-secondary" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">{section.title}</CardTitle>
                  <CardDescription className="text-text-muted">{section.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {section.settings?.map((setting, i) => (
                <div key={setting.label}>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm font-medium text-text-secondary">{setting.label}</span>
                    {setting.type === "badge" ? (
                      <Badge className="bg-green-500/15 text-green-400 border-0 text-xs">{setting.value}</Badge>
                    ) : setting.type === "secret" ? (
                      <code className="text-sm text-text-muted font-mono bg-elevated px-2 py-1 rounded">{setting.value}</code>
                    ) : (
                      <span className="text-sm text-foreground">
                        {setting.label === "Display Name" ? profileName : setting.label === "Email" ? profileEmail : setting.value}
                      </span>
                    )}
                  </div>
                  {i < (section.settings?.length ?? 0) - 1 && <Separator className="bg-border-subtle" />}
                </div>
              ))}
              {section.toggles?.map((toggle, i) => (
                <div key={toggle.label}>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm font-medium text-text-secondary">{toggle.label}</span>
                    <Switch defaultChecked={toggle.defaultOn} />
                  </div>
                  {i < (section.toggles?.length ?? 0) - 1 && <Separator className="bg-border-subtle" />}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Integrations */}
        <Card className="bg-surface border-border-subtle">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-elevated flex items-center justify-center">
                <Globe className="w-4.5 h-4.5 text-text-secondary" />
              </div>
              <div>
                <CardTitle className="text-lg text-foreground">Integrations</CardTitle>
                <CardDescription className="text-text-muted">Connect external tools and services</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {integrations.map((integration, i, arr) => (
              <div key={integration.name}>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium text-foreground">{integration.name}</span>
                  <div className="flex items-center gap-3">
                    <Badge className={`border-0 text-xs ${integration.connected ? "bg-green-500/15 text-green-400" : "bg-elevated text-text-muted"}`}>
                      {integration.connected ? "Connected" : "Not connected"}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-text-muted" />
                  </div>
                </div>
                {i < arr.length - 1 && <Separator className="bg-border-subtle" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pb-8">
          <Button onClick={handleSave} className="bg-primary hover:brightness-110 text-white font-medium px-8">
            Save Changes
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
