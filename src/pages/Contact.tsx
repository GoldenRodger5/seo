import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import { PageTransition } from "../components/MotionWrappers";
import { Mail, Send, CheckCircle } from "lucide-react";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setLoading(true);
    // Simulate submit — replace with real Supabase insert when ready
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <Layout>
      <PageTransition>
        <Helmet>
          <title>Contact TwinkVault — Questions & Affiliate Inquiries</title>
          <meta name="description" content="Contact TwinkVault with questions, feedback, or affiliate program inquiries. We read every message." />
          <link rel="canonical" href="https://twinkvault.com/contact" />
        </Helmet>

        <section className="py-16">
          <div className="container max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="hero-heading font-heading font-bold heading-gradient inline-block">Contact Us</h1>
              <p className="mt-4 text-muted-foreground">
                Questions, feedback, or affiliate inquiries — we read every message.
              </p>
            </motion.div>

            {submitted ? (
              <motion.div
                className="mt-10 glass-card rounded-lg p-10 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <CheckCircle size={48} className="mx-auto text-emerald-400" />
                <h2 className="mt-4 font-heading text-2xl font-bold">Message Sent</h2>
                <p className="mt-2 text-muted-foreground">Thanks for reaching out. We'll get back to you within 48 hours.</p>
              </motion.div>
            ) : (
              <motion.div
                className="mt-10 glass-card rounded-lg p-8 space-y-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className="w-full rounded-button border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className="w-full rounded-button border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Subject</label>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className="w-full rounded-button border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select a subject</option>
                    <option value="General Question">General Question</option>
                    <option value="Affiliate Inquiry">Affiliate Inquiry</option>
                    <option value="Site Suggestion">Site Suggestion</option>
                    <option value="Review Correction">Review Correction</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">Message</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Your message..."
                    className="w-full rounded-button border border-border bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || !form.name || !form.email || !form.message}
                  className="cta-btn gold-gradient inline-flex w-full items-center justify-center gap-2 rounded-button px-6 py-3 text-sm font-semibold text-secondary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : <><Send size={14} /> Send Message</>}
                </button>

                <div className="border-t border-border pt-5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail size={14} className="text-primary shrink-0" />
                    <span>Direct email: <a href="mailto:hello@twinkvault.com" className="text-primary hover:underline">hello@twinkvault.com</a></span>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    For affiliate program inquiries please include your program name and site URL in your message.
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      </PageTransition>
    </Layout>
  );
};

export default Contact;
