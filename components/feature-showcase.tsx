"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {
  FileText,
  Sparkles,
  Shield,
  Zap,
  Code,
  Star,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Verified
} from "lucide-react"

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
  benefits: string[]
  badge?: string
}

const features: Feature[] = [
  {
    icon: <Code className="h-8 w-8" />,
    title: "Markdown Support",
    description: "Write beautiful, formatted posts with full markdown support",
    gradient: "from-blue-500/10 via-cyan-500/10 to-teal-500/10",
    benefits: [
      "Bold, italic, and strikethrough text",
      "Headers, lists, and code blocks",
      "Links with custom text",
      "Quote blocks for emphasis",
      "Live preview as you type"
    ],
    badge: "Unique Feature"
  },
  {
    icon: <FileText className="h-8 w-8" />,
    title: "Long-Form Articles",
    description: "Write detailed articles up to 2000 characters",
    gradient: "from-purple-500/10 via-pink-500/10 to-rose-500/10",
    benefits: [
      "2000 character limit (vs 300)",
      "Perfect for thought leadership",
      "Full markdown formatting",
      "Custom article lexicon",
      "Stored in your Bluesky account"
    ],
    badge: "Exclusive"
  },
  {
    icon: <Star className="h-8 w-8" />,
    title: "Highlights System",
    description: "Curate and showcase your best posts",
    gradient: "from-amber-500/10 via-orange-500/10 to-red-500/10",
    benefits: [
      "Pin important posts to your profile",
      "Create a curated showcase",
      "Easy access to your best work",
      "Share your highlights collection",
      "Organized content discovery"
    ],
    badge: "Power Feature"
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: "Smart Verification",
    description: "One-time $1 verification for trusted accounts",
    gradient: "from-green-500/10 via-emerald-500/10 to-teal-500/10",
    benefits: [
      "Prevent bots and spam",
      "One-time $1 payment",
      "Valid forever across Bluesky",
      "Support independent development",
      "Build a trusted community"
    ],
    badge: "Anti-Spam"
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: "AI Integration",
    description: "Smart features powered by AI assistance",
    gradient: "from-violet-500/10 via-purple-500/10 to-fuchsia-500/10",
    benefits: [
      "Post suggestions and improvements",
      "Smart content analysis",
      "Automated tagging",
      "Trend detection",
      "Writing assistance"
    ],
    badge: "Coming Soon"
  },
  {
    icon: <Sparkles className="h-8 w-8" />,
    title: "Enhanced Feed Management",
    description: "Pin, organize, and customize your feeds",
    gradient: "from-indigo-500/10 via-blue-500/10 to-cyan-500/10",
    benefits: [
      "Pin feeds to home screen",
      "Drag-and-drop reordering",
      "Horizontal scrolling tabs",
      "Custom feed discovery",
      "Feed-specific compose contexts"
    ],
    badge: "Just Added"
  },
  {
    icon: <DollarSign className="h-8 w-8" />,
    title: "100% Free",
    description: "No subscriptions, no paywalls, just awesome features",
    gradient: "from-lime-500/10 via-green-500/10 to-emerald-500/10",
    benefits: [
      "All features completely free",
      "No hidden costs",
      "Optional $1 verification only",
      "Open source friendly",
      "Community supported"
    ],
    badge: "Forever Free"
  }
]

export function FeatureShowcase() {
  const [currentSlide, setCurrentSlide] = useState(0)

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Main heading */}
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-4 text-sm">
          Why Choose Socially<span className={"text-red-600"}>Dead</span>?
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          A <span className="text-primary">Better</span> Bluesky Client
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Everything you love about Bluesky, plus powerful features that make your experience exceptional
        </p>
      </div>

      {/* Feature carousel */}
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {features.map((feature, index) => (
            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1 h-full">
                <Card className={`h-full bg-gradient-to-br ${feature.gradient} border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg`}>
                  <CardContent className="p-6 flex flex-col h-full">
                    {/* Icon and badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary">
                        {feature.icon}
                      </div>
                      {feature.badge && (
                        <Badge variant="outline" className="text-xs">
                          {feature.badge}
                        </Badge>
                      )}
                    </div>

                    {/* Title and description */}
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {feature.description}
                    </p>

                    {/* Benefits list */}
                    <ul className="space-y-2 flex-1">
                      {feature.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>

      {/* Additional benefits */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2">
          <CardContent className="p-6 text-center">
            <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-4">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mb-2">Secure OAuth</h3>
            <p className="text-sm text-muted-foreground">
              We never see your password. Login securely through Bluesky's official OAuth.
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-6 text-center">
            <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mb-2">Lightning Fast</h3>
            <p className="text-sm text-muted-foreground">
              Built with Next.js 15 and React 19 for blazing fast performance.
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-6 text-center">
            <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mb-2">Always Improving</h3>
            <p className="text-sm text-muted-foreground">
              Regular updates with new features based on community feedback.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Verification info */}
      <Card className="mt-12 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <div className="p-4 rounded-full bg-primary/20">
                <Verified className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold mb-2">One-Time Verification</h3>
              <p className="text-muted-foreground mb-4">
                Optional $1 verification to prove you're human. Valid forever across all Bluesky clients.
                Helps fight spam and supports independent development.
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  No bots
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  One-time only
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Support development
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  100% optional
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
