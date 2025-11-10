import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Users, Settings, LogOut, Upload, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, setCsrfToken } from "@/lib/queryClient";
import { useDropzone } from "react-dropzone";

export default function AdminSettings() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });

  const [formData, setFormData] = useState({
    EVENT_DATE: "",
    EVENT_TIME: "",
    EVENT_VENUE: "",
    EVENT_ADDRESS: "",
  });

  useEffect(() => {
    if (Object.keys(settings).length > 0) {
      setFormData({
        EVENT_DATE: settings.EVENT_DATE || "",
        EVENT_TIME: settings.EVENT_TIME || "",
        EVENT_VENUE: settings.EVENT_VENUE || "",
        EVENT_ADDRESS: settings.EVENT_ADDRESS || "",
      });
      if (settings.PAYMENT_QR_URL) {
        setQrPreview(settings.PAYMENT_QR_URL);
      }
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      return apiRequest("POST", "/api/admin/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/public"] });
      toast({
        title: "Settings Updated",
        description: "Event information has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update settings.",
        variant: "destructive",
      });
    },
  });

  const uploadQrMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiRequest("POST", "/api/admin/upload-qr", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/public"] });
      toast({
        title: "QR Code Uploaded",
        description: "Payment QR code has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload QR code.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout", {}),
    onSuccess: () => {
      // Clear CSRF token on logout
      setCsrfToken(null);
      navigate("/admin");
    },
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(formData);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".png", ".jpg", ".jpeg"] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    onDrop: (accepted) => {
      if (accepted.length > 0) {
        const file = accepted[0];
        setQrFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setQrPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
        uploadQrMutation.mutate(file);
      }
    },
  });

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <Sidebar className="border-r border-sidebar-border">
          <SidebarContent>
            <div className="p-6 border-b border-sidebar-border">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold">IX</span>
                </div>
                <div>
                  <h2 className="font-bold">Innovate-X</h2>
                  <p className="text-xs text-sidebar-foreground/60">Admin Dashboard</p>
                </div>
              </div>
            </div>

            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className="hover-elevate active-elevate-2">
                      <Link href="/admin/dashboard" data-testid="link-sidebar-teams">
                        <Users className="w-4 h-4" />
                        <span>Teams</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className="hover-elevate active-elevate-2 data-[active=true]:bg-sidebar-accent">
                      <a href="#settings" data-active="true" data-testid="link-sidebar-settings">
                        <Settings className="w-4 h-4" />
                        <span>Content Settings</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="mt-auto p-4 border-t border-sidebar-border">
              <Button
                variant="ghost"
                className="w-full justify-start hover-elevate active-elevate-2"
                onClick={() => logoutMutation.mutate()}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="border-b border-border p-4 flex items-center gap-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <h1 className="text-xl font-bold">Content Settings</h1>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl space-y-6">
              {/* Event Information */}
              <Card className="bg-card border-card-border">
                <CardHeader>
                  <CardTitle>Event Information</CardTitle>
                  <CardDescription>
                    Manage event details displayed on the public website
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="event-date">Event Date</Label>
                      <Input
                        id="event-date"
                        type="text"
                        placeholder="e.g., November 25, 2025"
                        value={formData.EVENT_DATE}
                        onChange={(e) => setFormData({ ...formData, EVENT_DATE: e.target.value })}
                        data-testid="input-event-date"
                      />
                    </div>
                    <div>
                      <Label htmlFor="event-time">Event Time</Label>
                      <Input
                        id="event-time"
                        type="text"
                        placeholder="e.g., 9:00 AM - 5:00 PM"
                        value={formData.EVENT_TIME}
                        onChange={(e) => setFormData({ ...formData, EVENT_TIME: e.target.value })}
                        data-testid="input-event-time"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="event-venue">Venue Name</Label>
                    <Input
                      id="event-venue"
                      type="text"
                      placeholder="e.g., Main Auditorium"
                      value={formData.EVENT_VENUE}
                      onChange={(e) => setFormData({ ...formData, EVENT_VENUE: e.target.value })}
                      data-testid="input-event-venue"
                    />
                  </div>

                  <div>
                    <Label htmlFor="event-address">Full Address</Label>
                    <Input
                      id="event-address"
                      type="text"
                      placeholder="e.g., Your College, City, State, India"
                      value={formData.EVENT_ADDRESS}
                      onChange={(e) => setFormData({ ...formData, EVENT_ADDRESS: e.target.value })}
                      data-testid="input-event-address"
                    />
                  </div>

                  <Button
                    onClick={handleSaveSettings}
                    disabled={updateSettingsMutation.isPending}
                    className="bg-primary text-primary-foreground"
                    data-testid="button-save-settings"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateSettingsMutation.isPending ? "Saving..." : "Save Event Information"}
                  </Button>
                </CardContent>
              </Card>

              {/* Payment QR Code */}
              <Card className="bg-card border-card-border">
                <CardHeader>
                  <CardTitle>Payment QR Code</CardTitle>
                  <CardDescription>
                    Upload the QR code for registration payment (displayed in website footer)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                    data-testid="dropzone-qr"
                  >
                    <input {...getInputProps()} />
                    {qrPreview ? (
                      <div className="space-y-4">
                        <img
                          src={qrPreview}
                          alt="Payment QR Code"
                          className="w-48 h-48 mx-auto rounded-lg border border-border"
                        />
                        <p className="text-sm text-muted-foreground">
                          Drop a new image to replace or click to browse
                        </p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="font-medium mb-2">Drop QR code image here or click to browse</p>
                        <p className="text-sm text-muted-foreground">PNG or JPG • Max 5MB</p>
                      </>
                    )}
                  </div>
                  {uploadQrMutation.isPending && (
                    <p className="text-sm text-muted-foreground text-center">Uploading...</p>
                  )}
                </CardContent>
              </Card>

              {/* Future sections placeholder */}
              <Card className="bg-card border-card-border">
                <CardHeader>
                  <CardTitle>Additional Settings</CardTitle>
                  <CardDescription>
                    More content management options coming soon
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• Schedule management</p>
                    <p>• Prize information editor</p>
                    <p>• FAQ management</p>
                    <p>• Sponsor logo uploads</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
