import { motion } from "framer-motion";
import { CheckCircle, Mail, Calendar } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Thanks() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <Card className="bg-card border-card-border backdrop-blur-xl">
          <CardContent className="p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-12 h-12 text-primary" />
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-success-title">
              Registration Successful!
            </h1>

            <p className="text-muted-foreground text-lg mb-8">
              Thank you for registering your team for Innovate-X 2025
            </p>

            <div className="bg-muted/50 rounded-lg p-6 mb-8 space-y-4 text-left">
              <h3 className="font-semibold flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                What happens next?
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">1.</span>
                  <span>You'll receive a confirmation email with your registration details</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">2.</span>
                  <span>Our team will review your registration and payment proof</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">3.</span>
                  <span>Once verified, you'll get an acceptance email with event details and QR code</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">4.</span>
                  <span>You'll also receive a calendar invite (.ics file) for the event</span>
                </li>
              </ul>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-left text-sm">
                  <p className="font-semibold mb-1">Important</p>
                  <p className="text-muted-foreground">
                    Please check your email (including spam folder) for confirmation. If you don't receive it within 24 hours, contact us at organizer@innovatex.edu
                  </p>
                </div>
              </div>
            </div>

            <Link href="/">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-back-home">
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
