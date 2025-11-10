import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Users, Trophy, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TeamWithMembers } from "@shared/schema";

export default function Gallery() {
  const { data: teams = [], isLoading } = useQuery<TeamWithMembers[]>({
    queryKey: ["/api/gallery"],
    queryFn: async () => {
      const response = await fetch("/api/gallery");
      if (!response.ok) {
        throw new Error("Failed to fetch gallery teams");
      }
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" data-testid="link-home">
              <div className="flex items-center gap-3 hover-elevate active-elevate-2 cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">IX</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold">Innovate-X 2025</h1>
                  <p className="text-xs text-muted-foreground">Projects Gallery</p>
                </div>
              </div>
            </Link>
            <Link href="/">
              <Button variant="ghost" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Showcase Gallery
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore the innovative projects from verified teams participating in Innovate-X 2025
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-24">
            <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        ) : teams.length === 0 ? (
          <Card className="bg-card border-card-border max-w-md mx-auto">
            <CardContent className="p-12 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
              <p className="text-muted-foreground">
                Projects will appear here once teams are verified and opt-in to the gallery.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                <span className="text-foreground font-semibold">{teams.length}</span> project
                {teams.length !== 1 ? "s" : ""} showcased
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <Card
                  key={team.id}
                  className="bg-card border-card-border hover-elevate group overflow-hidden"
                  data-testid={`card-team-${team.id}`}
                >
                  <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge
                        variant={team.category === "SOFTWARE" ? "default" : "secondary"}
                        className="text-xs"
                        data-testid={`badge-category-${team.id}`}
                      >
                        {team.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-primary text-primary">
                        <Trophy className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors" data-testid={`text-project-title-${team.id}`}>
                      {team.projectTitle}
                    </CardTitle>
                    <CardDescription className="font-semibold" data-testid={`text-team-name-${team.id}`}>
                      {team.teamName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3" data-testid={`text-project-summary-${team.id}`}>
                      {team.projectSummary}
                    </p>

                    <div className="space-y-2 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground truncate" data-testid={`text-college-${team.id}`}>
                          {team.collegeName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">
                          {team.memberCount} member{team.memberCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {team.members.length > 0 && (
                        <div className="pt-2">
                          <p className="text-xs text-muted-foreground mb-1">Team Members:</p>
                          <div className="flex flex-wrap gap-1">
                            {team.members.map((member, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {member.fullName}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-border mt-24 py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; 2025 Innovate-X. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
