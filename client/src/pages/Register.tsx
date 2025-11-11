import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Upload, X } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { registrationSchema, type RegistrationInput } from "@shared/schema";
import { Navbar } from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useDropzone } from "react-dropzone";

const STEPS = ["Team Details", "Members", "Uploads", "Review"];

export default function Register() {
  const [currentStep, setCurrentStep] = useState(0);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [extraFile, setExtraFile] = useState<File | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Fetch public settings for payment QR
  const { data: publicSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings/public"],
    queryFn: async () => {
      const response = await fetch("/api/settings/public");
      if (!response.ok) throw new Error("Failed to fetch settings");
      return response.json();
    },
  });

  const form = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      teamName: "",
      category: "SOFTWARE",
      projectTitle: "",
      projectSummary: "",
      collegeName: "",
      mentorName: "",
      mentorEmail: "",
      contactPhone: "",
      contactEmail: "",
      memberCount: 2,
      paymentProofUrl: "",
      extraDocUrl: "",
      members: [
        { fullName: "", email: "", year: "", department: "" },
        { fullName: "", email: "", year: "", department: "" },
      ],
    },
  });

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem("registration-draft");
    if (draft) {
      try {
        const data = JSON.parse(draft);
        form.reset(data);
      } catch (e) {
        console.error("Failed to load draft", e);
      }
    }
  }, []);

  // Save draft to localStorage (debounced)
  useEffect(() => {
    const subscription = form.watch((value) => {
      const timeout = setTimeout(() => {
        localStorage.setItem("registration-draft", JSON.stringify(value));
      }, 1000);
      return () => clearTimeout(timeout);
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const memberCount = form.watch("memberCount");

  // Update members array when count changes
  useEffect(() => {
    const current = form.getValues("members");
    if (current.length < memberCount) {
      const newMembers = [...current];
      for (let i = current.length; i < memberCount; i++) {
        newMembers.push({ fullName: "", email: "", year: "", department: "" });
      }
      form.setValue("members", newMembers);
    } else if (current.length > memberCount) {
      form.setValue("members", current.slice(0, memberCount));
    }
  }, [memberCount]);

  const registrationMutation = useMutation({
    mutationFn: async (data: RegistrationInput & { paymentFile: File; extraFile?: File }) => {
      const formData = new FormData();
      formData.append("data", JSON.stringify({
        ...data,
        paymentFile: undefined,
        extraFile: undefined,
      }));
      formData.append("paymentFile", data.paymentFile);
      if (data.extraFile) {
        formData.append("extraFile", data.extraFile);
      }

      return apiRequest("POST", "/api/register", formData);
    },
    onSuccess: () => {
      localStorage.removeItem("registration-draft");
      toast({
        title: "Registration Successful!",
        description: "Your team has been registered. Check your email for confirmation.",
      });
      navigate("/thanks");
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: RegistrationInput) => {
    if (!paymentFile) {
      toast({
        title: "Payment Proof Required",
        description: "Please upload your payment proof.",
        variant: "destructive",
      });
      return;
    }
    registrationMutation.mutate({ ...data, paymentFile, extraFile: extraFile || undefined });
  };

  const nextStep = async () => {
    const fields = getStepFields(currentStep);
    const isValid = await form.trigger(fields as any);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const getStepFields = (step: number) => {
    switch (step) {
      case 0:
        return ["teamName", "category", "projectTitle", "projectSummary", "collegeName", "mentorName", "mentorEmail", "contactPhone", "contactEmail", "memberCount"];
      case 1:
        return ["members"];
      case 2:
        return [];
      default:
        return [];
    }
  };

  const PaymentDropzone = () => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      accept: { "image/*": [".png", ".jpg", ".jpeg"], "application/pdf": [".pdf"] },
      maxSize: 10 * 1024 * 1024,
      multiple: false,
      onDrop: (accepted) => {
        if (accepted.length > 0) {
          setPaymentFile(accepted[0]);
          form.setValue("paymentProofUrl", "placeholder");
        }
      },
    });

    return (
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
        data-testid="dropzone-payment"
      >
        <input {...getInputProps()} />
        {paymentFile ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Check className="w-6 h-6 text-primary" />
              <span>{paymentFile.name}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setPaymentFile(null);
                form.setValue("paymentProofUrl", "");
              }}
              data-testid="button-remove-payment"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium mb-2">Drop payment proof here or click to browse</p>
            <p className="text-sm text-muted-foreground">PNG, JPG, or PDF • Max 10MB</p>
          </>
        )}
      </div>
    );
  };

  const ExtraDocDropzone = () => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      accept: { "image/*": [".png", ".jpg", ".jpeg"], "application/pdf": [".pdf"] },
      maxSize: 10 * 1024 * 1024,
      multiple: false,
      onDrop: (accepted) => {
        if (accepted.length > 0) {
          setExtraFile(accepted[0]);
          form.setValue("extraDocUrl", "placeholder");
        }
      },
    });

    return (
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
        data-testid="dropzone-extra"
      >
        <input {...getInputProps()} />
        {extraFile ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Check className="w-6 h-6 text-primary" />
              <span>{extraFile.name}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setExtraFile(null);
                form.setValue("extraDocUrl", "");
              }}
              data-testid="button-remove-extra"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium mb-2">Drop supporting document here or click to browse</p>
            <p className="text-sm text-muted-foreground">PNG, JPG, or PDF • Max 10MB (Optional)</p>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-32">
        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex justify-between mb-4">
            {STEPS.map((step, index) => (
              <div key={index} className="flex-1">
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      index <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 ${index < currentStep ? "bg-primary" : "bg-muted"}`} />
                  )}
                </div>
                <p className="text-sm mt-2 text-center">{step}</p>
              </div>
            ))}
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Save Draft Indicator */}
        <div className="flex justify-end mb-4">
          <span className="text-sm text-muted-foreground">
            Draft saved automatically
          </span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card className="bg-card border-card-border backdrop-blur-xl">
              <CardHeader>
                <CardTitle>{STEPS[currentStep]}</CardTitle>
                <CardDescription>
                  {currentStep === 0 && "Enter your team and project information"}
                  {currentStep === 1 && "Add details for all team members (2-4 members)"}
                  {currentStep === 2 && "Upload required documents"}
                  {currentStep === 3 && "Review and submit your registration"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <AnimatePresence mode="wait">
                  {/* Step 0: Team Details */}
                  {currentStep === 0 && (
                    <motion.div
                      key="step-0"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <FormField
                        control={form.control}
                        name="teamName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Team Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter team name" {...field} data-testid="input-team-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-category">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="SOFTWARE">Software</SelectItem>
                                <SelectItem value="HARDWARE">Hardware</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="projectTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Title *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter project title" {...field} data-testid="input-project-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="projectSummary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Summary * (100-1000 characters)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe your project..."
                                className="min-h-32"
                                {...field}
                                data-testid="textarea-project-summary"
                              />
                            </FormControl>
                            <p className="text-sm text-muted-foreground">{field.value.length}/1000 characters</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="collegeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>College Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter college name" {...field} data-testid="input-college-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="mentorName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mentor Name (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter mentor name" {...field} data-testid="input-mentor-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="mentorEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mentor Email (Optional)</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="mentor@example.com" {...field} data-testid="input-mentor-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Phone *</FormLabel>
                              <FormControl>
                                <Input placeholder="10-digit phone number" {...field} data-testid="input-contact-phone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="contactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Email *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="contact@example.com" {...field} data-testid="input-contact-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="memberCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Members * (2-4)</FormLabel>
                            <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value.toString()}>
                              <FormControl>
                                <SelectTrigger data-testid="select-member-count">
                                  <SelectValue placeholder="Select member count" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="2">2 Members</SelectItem>
                                <SelectItem value="3">3 Members</SelectItem>
                                <SelectItem value="4">4 Members</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  )}

                  {/* Step 1: Members */}
                  {currentStep === 1 && (
                    <motion.div
                      key="step-1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      {Array.from({ length: memberCount }).map((_, index) => (
                        <Card key={index} className="bg-background border-border">
                          <CardHeader>
                            <CardTitle className="text-lg">Member {index + 1}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <FormField
                              control={form.control}
                              name={`members.${index}.fullName`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Full Name *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter full name" {...field} data-testid={`input-member-${index}-name`} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`members.${index}.email`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email *</FormLabel>
                                  <FormControl>
                                    <Input type="email" placeholder="member@example.com" {...field} data-testid={`input-member-${index}-email`} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`members.${index}.year`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Year *</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g., 2nd Year" {...field} data-testid={`input-member-${index}-year`} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`members.${index}.department`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Department *</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g., Computer Science" {...field} data-testid={`input-member-${index}-department`} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </motion.div>
                  )}

                  {/* Step 2: Uploads */}
                  {currentStep === 2 && (
                    <motion.div
                      key="step-2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      {/* Payment QR Code */}
                      {publicSettings?.PAYMENT_QR_URL ? (
                        <div className="bg-muted/30 border border-primary/20 rounded-xl p-6">
                          <Label className="mb-4 block text-lg font-semibold">Step 1: Scan QR to Pay Registration Fee</Label>
                          <div className="flex flex-col items-center gap-4">
                            <img 
                              src={publicSettings.PAYMENT_QR_URL} 
                              alt="Payment QR Code" 
                              className="w-64 h-64 object-contain border-2 border-primary/30 rounded-lg"
                              data-testid="img-payment-qr"
                            />
                            <p className="text-sm text-muted-foreground text-center">
                              Scan this QR code to pay the registration fee, then upload your payment proof below.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                          <p className="text-sm text-yellow-600 dark:text-yellow-400 text-center">
                            Payment QR code not available yet. Please contact the organizers at Sm4686771@gmail.com for payment details.
                          </p>
                        </div>
                      )}

                      <div>
                        <Label className="mb-4 block">Step 2: Upload Payment Proof * (Required)</Label>
                        <PaymentDropzone />
                      </div>

                      <div>
                        <Label className="mb-4 block">Supporting Document (Optional)</Label>
                        <ExtraDocDropzone />
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Review */}
                  {currentStep === 3 && (
                    <motion.div
                      key="step-3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                        <h3 className="font-semibold text-lg mb-4">Registration Summary</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Team Name</p>
                            <p className="font-medium" data-testid="text-review-team-name">{form.getValues("teamName")}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Category</p>
                            <p className="font-medium" data-testid="text-review-category">{form.getValues("category")}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Project Title</p>
                            <p className="font-medium" data-testid="text-review-project-title">{form.getValues("projectTitle")}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">College</p>
                            <p className="font-medium">{form.getValues("collegeName")}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Project Summary</p>
                          <p className="text-sm">{form.getValues("projectSummary")}</p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Team Members ({memberCount})</p>
                          {form.getValues("members").map((member, i) => (
                            <p key={i} className="text-sm">
                              {i + 1}. {member.fullName} ({member.email})
                            </p>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Payment Proof</p>
                            <p className="text-sm font-medium text-primary">{paymentFile ? "✓ Uploaded" : "✗ Missing"}</p>
                          </div>
                          {extraFile && (
                            <div>
                              <p className="text-sm text-muted-foreground">Extra Document</p>
                              <p className="text-sm font-medium text-primary">✓ Uploaded</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        By submitting this registration, you confirm that all information provided is accurate and complete.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    data-testid="button-prev-step"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>

                  {currentStep < STEPS.length - 1 ? (
                    <Button type="button" onClick={nextStep} data-testid="button-next-step">
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={registrationMutation.isPending}
                      className="bg-primary text-primary-foreground"
                      data-testid="button-submit-registration"
                    >
                      {registrationMutation.isPending ? "Submitting..." : "Submit Registration"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
}
