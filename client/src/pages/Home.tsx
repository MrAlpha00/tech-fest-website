import { Calendar, MapPin, Users, Trophy, Clock, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Navbar } from "@/components/Navbar";
import { useQuery } from "@tanstack/react-query";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function Home() {
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings/public"],
  });

  const eventInfo = {
    date: settings?.EVENT_DATE || "November 25, 2025",
    time: settings?.EVENT_TIME || "9:00 AM - 5:00 PM",
    venue: settings?.EVENT_VENUE || "Main Auditorium",
    address: settings?.EVENT_ADDRESS || "Your College, City, State",
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 text-center">
          <motion.div {...fadeInUp}>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              Build. Break. <span className="text-primary">Brag.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-4">
              Innovate-X 2025
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
              The premier inter-college project expo showcasing the best in Software and Hardware innovation
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link href="/register">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg rounded-xl" data-testid="button-hero-register">
                  Register Your Team
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 py-6 text-lg rounded-xl" data-testid="button-view-brochure">
                View Brochure
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span>500+ Students</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span>50+ Projects</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Event Info Section */}
      <section id="event" className="py-20 md:py-32 bg-card/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Event <span className="text-primary">Information</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-card border-card-border hover:border-primary/30 transition-colors hover-elevate">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Calendar className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Date & Time</h3>
                  <p className="text-muted-foreground">{eventInfo.date}</p>
                  <p className="text-sm text-muted-foreground">{eventInfo.time}</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-card-border hover:border-primary/30 transition-colors hover-elevate">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <MapPin className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Location</h3>
                  <p className="text-muted-foreground">{eventInfo.venue}</p>
                  <p className="text-sm text-muted-foreground">{eventInfo.address}</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-card-border hover:border-primary/30 transition-colors hover-elevate">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <FileText className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Categories</h3>
                  <p className="text-muted-foreground">Software</p>
                  <p className="text-muted-foreground">Hardware</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tracks & Prizes Section */}
      <section id="tracks" className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Tracks & <span className="text-primary">Prizes</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-gradient-to-br from-card to-card/50 border-card-border hover-elevate">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                      <span className="text-3xl">💻</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Software Track</h3>
                      <p className="text-muted-foreground">Web, Mobile, AI/ML, Cloud</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">1st Prize</span>
                      <span className="text-xl font-bold text-primary">₹50,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">2nd Prize</span>
                      <span className="text-xl font-bold text-primary">₹30,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">3rd Prize</span>
                      <span className="text-xl font-bold text-primary">₹20,000</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-card to-card/50 border-card-border hover-elevate">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                      <span className="text-3xl">⚙️</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Hardware Track</h3>
                      <p className="text-muted-foreground">IoT, Robotics, Electronics</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">1st Prize</span>
                      <span className="text-xl font-bold text-primary">₹50,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">2nd Prize</span>
                      <span className="text-xl font-bold text-primary">₹30,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">3rd Prize</span>
                      <span className="text-xl font-bold text-primary">₹20,000</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Schedule Section */}
      <section id="schedule" className="py-20 md:py-32 bg-card/50">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Event <span className="text-primary">Schedule</span>
            </h2>
            <div className="space-y-6">
              {[
                { time: "9:00 AM", title: "Registration & Check-in", desc: "Team registration and setup" },
                { time: "10:00 AM", title: "Opening Ceremony", desc: "Welcome address and event overview" },
                { time: "10:30 AM", title: "Project Showcase Begins", desc: "Teams present their innovations" },
                { time: "1:00 PM", title: "Lunch Break", desc: "Networking and refreshments" },
                { time: "2:00 PM", title: "Judging Rounds", desc: "Expert panel evaluation" },
                { time: "4:00 PM", title: "Prize Distribution", desc: "Winners announcement and awards" },
                { time: "5:00 PM", title: "Closing Ceremony", desc: "Vote of thanks and networking" },
              ].map((item, index) => (
                <div key={index} className="flex gap-6 group">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    {index < 6 && <div className="w-px h-full bg-border mt-2" />}
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="text-sm text-primary font-semibold mb-1">{item.time}</div>
                    <h4 className="text-lg font-semibold mb-1">{item.title}</h4>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Frequently Asked <span className="text-primary">Questions</span>
            </h2>
            <Accordion type="single" collapsible className="space-y-4">
              {[
                {
                  q: "Who can participate in Innovate-X 2025?",
                  a: "Students from all colleges are welcome! Teams must consist of 2-4 members from the same institution.",
                },
                {
                  q: "What are the project categories?",
                  a: "We have two tracks: Software (Web, Mobile, AI/ML, Cloud) and Hardware (IoT, Robotics, Electronics).",
                },
                {
                  q: "Is there a registration fee?",
                  a: "Yes, there is a nominal registration fee. Payment proof must be uploaded during registration.",
                },
                {
                  q: "What should teams bring on the event day?",
                  a: "Bring your project, required hardware/equipment, team ID, and confirmation email. We'll provide power supply and basic infrastructure.",
                },
                {
                  q: "How will projects be judged?",
                  a: "Projects are evaluated on innovation, technical complexity, practical implementation, presentation, and potential impact.",
                },
                {
                  q: "When will results be announced?",
                  a: "Winners will be announced during the prize distribution ceremony at 4:00 PM on the event day.",
                },
              ].map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border border-border rounded-lg px-6 bg-card">
                  <AccordionTrigger className="text-left hover:no-underline py-4" data-testid={`accordion-faq-${index}`}>
                    <span className="font-semibold">{faq.q}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Sponsors Section */}
      <section id="sponsors" className="py-20 md:py-32 bg-card/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Our <span className="text-primary">Sponsors</span>
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              Powered by industry leaders and innovators
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-card border-card-border hover-elevate">
                  <CardContent className="p-8 flex items-center justify-center h-32">
                    <div className="text-muted-foreground text-sm">Sponsor Logo {i}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <h3 className="font-bold text-lg mb-4">Innovate-X</h3>
              <p className="text-sm text-muted-foreground">
                The premier inter-college tech expo showcasing innovation and creativity.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#event" className="hover:text-primary transition-colors">Event Info</a></li>
                <li><a href="#tracks" className="hover:text-primary transition-colors">Tracks & Prizes</a></li>
                <li><a href="#schedule" className="hover:text-primary transition-colors">Schedule</a></li>
                <li><a href="#faq" className="hover:text-primary transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact Us</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Email: organizer@innovatex.edu
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Phone: +91 12345 67890
              </p>
              {settings?.PAYMENT_QR_URL && (
                <div>
                  <p className="text-sm font-semibold mb-2">Payment QR Code</p>
                  <img
                    src={settings.PAYMENT_QR_URL}
                    alt="Payment QR Code"
                    className="w-32 h-32 rounded-lg border border-border"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2025 Innovate-X. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
