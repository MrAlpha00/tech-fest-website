import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  Users, Settings, LogOut, Search, Filter, Download, Eye, Check, X, FileText, Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, setCsrfToken } from "@/lib/queryClient";
import type { TeamWithMembers } from "@shared/schema";
import { format } from "date-fns";

type StatusFilter = "ALL" | "PENDING" | "VERIFIED" | "REJECTED";
type CategoryFilter = "ALL" | "SOFTWARE" | "HARDWARE";

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [selectedTeam, setSelectedTeam] = useState<TeamWithMembers | null>(null);
  const [actionDialog, setActionDialog] = useState<{ type: "verify" | "reject"; team: TeamWithMembers } | null>(null);
  const [actionNote, setActionNote] = useState("");
  const { toast } = useToast();

  const { data: teams = [], isLoading } = useQuery<TeamWithMembers[]>({
    queryKey: ["/api/admin/teams", statusFilter, categoryFilter, searchQuery],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ teamId, status, note }: { teamId: string; status: "VERIFIED" | "REJECTED"; note?: string }) => {
      return apiRequest("PATCH", `/api/admin/teams/${teamId}/status`, { status, note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teams"] });
      setActionDialog(null);
      setActionNote("");
      toast({
        title: "Status Updated",
        description: "Team status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update team status.",
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

  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      searchQuery === "" ||
      team.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.collegeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.projectTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || team.status === statusFilter;
    const matchesCategory = categoryFilter === "ALL" || team.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleAction = (team: TeamWithMembers, action: "verify" | "reject") => {
    setActionDialog({ type: action, team });
  };

  const confirmAction = () => {
    if (!actionDialog) return;
    updateStatusMutation.mutate({
      teamId: actionDialog.team.id,
      status: actionDialog.type === "verify" ? "VERIFIED" : "REJECTED",
      note: actionNote || undefined,
    });
  };

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
                      <a href="#teams" data-testid="link-sidebar-teams">
                        <Users className="w-4 h-4" />
                        <span>Teams</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className="hover-elevate active-elevate-2">
                      <Link href="/admin/settings" data-testid="link-sidebar-settings">
                        <Settings className="w-4 h-4" />
                        <span>Content Settings</span>
                      </Link>
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
            <h1 className="text-xl font-bold">Team Management</h1>
          </header>

          <main className="flex-1 overflow-auto p-6">
            {/* Filters */}
            <Card className="mb-6 bg-card border-card-border">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Search teams, colleges, projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as StatusFilter)}>
                    <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="VERIFIED">Verified</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val as CategoryFilter)}>
                    <SelectTrigger className="w-full md:w-48" data-testid="select-category-filter">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Categories</SelectItem>
                      <SelectItem value="SOFTWARE">Software</SelectItem>
                      <SelectItem value="HARDWARE">Hardware</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" data-testid="button-export">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card className="bg-card border-card-border">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">Total Teams</p>
                  <p className="text-3xl font-bold" data-testid="text-stat-total">{teams.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-card-border">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">Pending</p>
                  <p className="text-3xl font-bold text-yellow-500" data-testid="text-stat-pending">
                    {teams.filter((t) => t.status === "PENDING").length}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card border-card-border">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">Verified</p>
                  <p className="text-3xl font-bold text-primary" data-testid="text-stat-verified">
                    {teams.filter((t) => t.status === "VERIFIED").length}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card border-card-border">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">Rejected</p>
                  <p className="text-3xl font-bold text-destructive" data-testid="text-stat-rejected">
                    {teams.filter((t) => t.status === "REJECTED").length}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Teams Table */}
            <Card className="bg-card border-card-border">
              <CardHeader>
                <CardTitle>Registered Teams</CardTitle>
                <CardDescription>Manage team registrations and verifications</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">Loading teams...</div>
                ) : filteredTeams.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No teams found</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Team Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>College</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTeams.map((team) => (
                        <TableRow key={team.id} className="hover-elevate" data-testid={`row-team-${team.id}`}>
                          <TableCell className="font-medium">{team.teamName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {team.category.toLowerCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>{team.collegeName}</TableCell>
                          <TableCell>{team.memberCount}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                team.status === "VERIFIED"
                                  ? "default"
                                  : team.status === "REJECTED"
                                  ? "destructive"
                                  : "secondary"
                              }
                              data-testid={`badge-status-${team.id}`}
                            >
                              {team.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(team.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedTeam(team)}
                                data-testid={`button-view-${team.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {team.status === "PENDING" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleAction(team, "verify")}
                                    data-testid={`button-verify-${team.id}`}
                                  >
                                    <Check className="w-4 h-4 text-primary" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleAction(team, "reject")}
                                    data-testid={`button-reject-${team.id}`}
                                  >
                                    <X className="w-4 h-4 text-destructive" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      {/* View Team Dialog */}
      {selectedTeam && (
        <Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTeam.teamName}</DialogTitle>
              <DialogDescription>Team registration details</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Project Title</Label>
                  <p className="font-medium">{selectedTeam.projectTitle}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="font-medium capitalize">{selectedTeam.category.toLowerCase()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">College</Label>
                  <p className="font-medium">{selectedTeam.collegeName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact</Label>
                  <p className="text-sm">{selectedTeam.contactEmail}</p>
                  <p className="text-sm">{selectedTeam.contactPhone}</p>
                </div>
                {selectedTeam.mentorName && (
                  <div>
                    <Label className="text-muted-foreground">Mentor</Label>
                    <p className="font-medium">{selectedTeam.mentorName}</p>
                    <p className="text-sm">{selectedTeam.mentorEmail}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Project Summary</Label>
                  <p className="text-sm">{selectedTeam.projectSummary}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground mb-2 block">Team Members ({selectedTeam.memberCount})</Label>
                  {selectedTeam.members.map((member, i) => (
                    <div key={member.id} className="bg-muted/50 rounded-lg p-3 mb-2">
                      <p className="font-medium">{member.fullName}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.year} • {member.department}
                      </p>
                    </div>
                  ))}
                </div>

                <div>
                  <Label className="text-muted-foreground mb-2 block">Payment Proof</Label>
                  {selectedTeam.paymentProofUrl && (
                    <a
                      href={selectedTeam.paymentProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={selectedTeam.paymentProofUrl}
                        alt="Payment proof"
                        className="w-full rounded-lg border border-border hover:opacity-80 transition-opacity"
                      />
                    </a>
                  )}
                </div>

                {selectedTeam.extraDocUrl && (
                  <div>
                    <Label className="text-muted-foreground mb-2 block">Supporting Document</Label>
                    <a
                      href={selectedTeam.extraDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      View Document
                    </a>
                  </div>
                )}
              </div>
            </div>

            {selectedTeam.status === "PENDING" && (
              <DialogFooter className="gap-2">
                <Button
                  variant="destructive"
                  onClick={() => handleAction(selectedTeam, "reject")}
                  data-testid="button-modal-reject"
                >
                  Reject
                </Button>
                <Button
                  className="bg-primary text-primary-foreground"
                  onClick={() => handleAction(selectedTeam, "verify")}
                  data-testid="button-modal-verify"
                >
                  Verify & Approve
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Action Confirmation Dialog */}
      {actionDialog && (
        <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionDialog.type === "verify" ? "Verify Team" : "Reject Team"}
              </DialogTitle>
              <DialogDescription>
                {actionDialog.type === "verify"
                  ? "This will send acceptance emails with QR code and calendar invite to all team members."
                  : "This will send rejection notification to the team contact email."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Note (Optional)</Label>
                <Textarea
                  placeholder="Add a note for the team..."
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  data-testid="textarea-action-note"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialog(null)}>
                Cancel
              </Button>
              <Button
                onClick={confirmAction}
                disabled={updateStatusMutation.isPending}
                className={actionDialog.type === "verify" ? "bg-primary text-primary-foreground" : ""}
                variant={actionDialog.type === "reject" ? "destructive" : "default"}
                data-testid="button-confirm-action"
              >
                {updateStatusMutation.isPending
                  ? "Processing..."
                  : actionDialog.type === "verify"
                  ? "Verify & Send Emails"
                  : "Reject & Notify"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </SidebarProvider>
  );
}
