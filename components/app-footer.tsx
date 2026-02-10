"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { VerificationCheckout } from "@/components/verification-checkout"

export function AppFooter() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="border-t border-border bg-background py-4 mt-auto">
      <div className="mx-auto max-w-4xl px-4">
        {/* Main credits row */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span>
            Powered by{" "}
            <Link
              href="https://bsky.app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              <svg viewBox="0 0 568 501" className="h-3.5 w-3.5 text-[#0085ff]" fill="currentColor">
                <path d="M123.121 33.6637C188.241 82.5526 258.281 181.681 284 234.873C309.719 181.681 379.759 82.5526 444.879 33.6637C491.866 -1.61183 568 -28.9064 568 57.9464C568 75.2916 558.055 203.659 552.222 224.501C531.947 296.954 458.067 315.434 392.347 304.249C507.222 323.8 536.444 388.56 473.333 453.32C353.473 576.312 301.061 422.461 287.631 383.039C285.169 374.388 284.017 370.036 284 373.719C283.983 370.036 282.831 374.388 280.369 383.039C266.939 422.461 214.527 576.312 94.6667 453.32C31.5556 388.56 60.7778 323.8 175.653 304.249C109.933 315.434 36.0533 296.954 15.7778 224.501C9.94525 203.659 0 75.2916 0 57.9464C0 -28.9064 76.1345 -1.61183 123.121 33.6637Z"/>
              </svg>
              Bluesky
            </Link>
          </span>
          <span className="hidden sm:inline">|</span>
          <span>
            Created by{" "}
            <Link
              href="https://mirasworld.sociallydead.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              ♥️Mira☕
            </Link>
            {" & "}
            <Link
              href="https://thewhitewitchtm.sociallydead.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              🧙‍♀️𝕿𝖍𝖊 𝖂𝖍𝖎𝖙𝖊 𝖂𝖎𝖙𝖈𝖍™✨
            </Link>
          </span>
          <span className="hidden sm:inline">|</span>
          <VerificationCheckout
            trigger={
              <button className="font-medium text-primary hover:underline">
                Support Us & Get Verified
              </button>
            }
          />
        </div>
        
        {/* Legal links row */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span>&copy; {currentYear} SociallyDead. All rights reserved.</span>
          <span className="hidden sm:inline">|</span>
          <PrivacyPolicyDialog />
          <span className="hidden sm:inline">|</span>
          <TermsOfServiceDialog />
          <span className="hidden sm:inline">|</span>
          <DisclaimerDialog />
        </div>
      </div>
    </footer>
  )
}

function PrivacyPolicyDialog() {
  return (
    <Dialog>
      <DialogTrigger className="hover:text-primary hover:underline">
        Privacy Policy
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Privacy Policy</DialogTitle>
          <DialogDescription>Last updated: February 2026</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold mb-2">1. Information We Collect</h3>
              <p className="text-muted-foreground">
                SociallyDead is a client application for the Bluesky social network. We do not collect, store, or process your personal data on our servers. All authentication is handled directly through Bluesky&apos;s OAuth system.
              </p>
            </section>
            
            <section>
              <h3 className="font-semibold mb-2">2. Data Storage</h3>
              <p className="text-muted-foreground">
                We do not use cookies or persistent local storage for tracking purposes. The only temporary storage used is sessionStorage for draft posts, which is automatically cleared when you close your browser tab.
              </p>
            </section>
            
            <section>
              <h3 className="font-semibold mb-2">3. Third-Party Services</h3>
              <p className="text-muted-foreground">
                This application connects to Bluesky&apos;s API services. Your interactions with Bluesky are governed by Bluesky&apos;s own privacy policy. We also use Vercel Analytics for anonymous, aggregated usage statistics that do not identify individual users.
              </p>
            </section>
            
            <section>
              <h3 className="font-semibold mb-2">4. Authentication</h3>
              <p className="text-muted-foreground">
                When you sign in, you authenticate directly with Bluesky using their OAuth protocol. We never see, store, or have access to your password. Your authentication tokens are stored securely in your browser session.
              </p>
            </section>
            
            <section>
              <h3 className="font-semibold mb-2">5. Children&apos;s Privacy</h3>
              <p className="text-muted-foreground">
                This service is not intended for children under 13 years of age. We do not knowingly collect information from children under 13.
              </p>
            </section>
            
            <section>
              <h3 className="font-semibold mb-2">6. Changes to This Policy</h3>
              <p className="text-muted-foreground">
                We may update this privacy policy from time to time. Any changes will be reflected on this page with an updated revision date.
              </p>
            </section>
            
            <section>
              <h3 className="font-semibold mb-2">7. Contact</h3>
              <p className="text-muted-foreground">
                If you have questions about this privacy policy, please contact us through our Bluesky profiles linked in the footer.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function TermsOfServiceDialog() {
  return (
    <Dialog>
      <DialogTrigger className="hover:text-primary hover:underline">
        Terms of Service
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
          <DialogDescription>Last updated: February 2026</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold mb-2">1. Acceptance of Terms</h3>
              <p className="text-muted-foreground">
                By accessing or using SociallyDead, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use this service.
              </p>
            </section>
            
            <section>
              <h3 className="font-semibold mb-2">2. Description of Service</h3>
              <p className="text-muted-foreground">
                SociallyDead is a third-party client for the Bluesky social network. We provide a user interface to interact with Bluesky&apos;s services but are not affiliated with or endorsed by Bluesky PBC.
              </p>
            </section>
            
            <section>
              <h3 className="font-semibold mb-2">3. User Responsibilities</h3>
              <p className="text-muted-foreground">
                You are responsible for your use of Bluesky through this client, including compliance with Bluesky&apos;s terms of service and community guidelines. You agree not to use this service for any unlawful purpose or in violation of any applicable laws.
              </p>
            </section>
            
            <section>
              <h3 className="font-semibold mb-2">4. Intellectual Property</h3>
              <p className="text-muted-foreground">
                SociallyDead is open-source software. The source code is available under its respective license. Bluesky and its logo are trademarks of Bluesky PBC.
              </p>
            </section>
            
            <section>
              <h3 className="font-semibold mb-2">5. Disclaimer of Warranties</h3>
              <p className="text-muted-foreground">
                This service is provided &quot;as is&quot; without warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free.
              </p>
            </section>
            
            <section>
              <h3 className="font-semibold mb-2">6. Limitation of Liability</h3>
              <p className="text-muted-foreground">
                To the fullest extent permitted by law, SociallyDead and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.
              </p>
            </section>
            
            <section>
              <h3 className="font-semibold mb-2">7. Modifications</h3>
              <p className="text-muted-foreground">
                We reserve the right to modify or discontinue the service at any time without notice. We may also update these terms from time to time, and continued use constitutes acceptance of any changes.
              </p>
            </section>
            
            <section>
              <h3 className="font-semibold mb-2">8. Governing Law</h3>
              <p className="text-muted-foreground">
                These terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function DisclaimerDialog() {
  return (
    <Dialog>
      <DialogTrigger className="hover:text-primary hover:underline">
        Disclaimer
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Disclaimer</DialogTitle>
          <DialogDescription>Important information about this service</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold mb-2">Third-Party Application</h3>
              <p className="text-muted-foreground">
                SociallyDead is an independent, third-party client for the Bluesky social network. We are not affiliated with, endorsed by, or officially connected with Bluesky PBC or any of its subsidiaries or affiliates.
              </p>
            </section>
            
            <section>
              <h3 className="font-semibold mb-2">No Warranty</h3>
              <p className="text-muted-foreground">
                This application is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We make no representations or warranties of any kind, express or implied, regarding the operation of this service or the information, content, or materials included.
              </p>
            </section>
            
            <section>
              <h3 className="font-semibold mb-2">User Content</h3>
              <p className="text-muted-foreground">
                All content displayed in this application originates from Bluesky&apos;s network. We do not control, endorse, or take responsibility for any user-generated content. Content moderation is handled by Bluesky according to their policies.
              </p>
            </section>
            
            <section>
              <h3 className="font-semibold mb-2">Service Availability</h3>
              <p className="text-muted-foreground">
                We do not guarantee that this service will be available at all times. Access depends on Bluesky&apos;s API availability and our hosting infrastructure. Service may be interrupted for maintenance or due to factors beyond our control.
              </p>
            </section>
            
            <section>
              <h3 className="font-semibold mb-2">Open Source</h3>
              <p className="text-muted-foreground">
                SociallyDead is an open-source project. Contributions and feedback are welcome through our GitHub repository. The source code is provided for educational and collaborative purposes.
              </p>
            </section>
            
            <section>
              <h3 className="font-semibold mb-2">Data Privacy</h3>
              <p className="text-muted-foreground">
                We do not use cookies for tracking. We do not collect or store personal data. All authentication is handled directly by Bluesky. Only anonymous, aggregated analytics are collected through Vercel Analytics.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
