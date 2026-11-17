import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, CheckCircle2, Send, Globe } from 'lucide-react';
import type { OwnerContactConfig } from '../../data/ownerConfig';
import type { AppLang } from '../../data/i18n';
import type { ActivePage } from '../Header';

interface ContactPageProps {
  ownerConfig: OwnerContactConfig;
  lang: AppLang;
  onNavigate: (page: ActivePage) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({
  ownerConfig,
  lang,
  onNavigate,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject || !message.trim()) {
      setError(
        lang === 'bn'
          ? 'অনুগ্রহ করে সমস্ত প্রয়োজনীয় ঘর পূরণ করুন।'
          : 'Please fill in all required fields.'
      );
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(
        lang === 'bn'
          ? 'অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা লিখুন।'
          : 'Please enter a valid email address.'
      );
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          name: name.trim(),
          email: email.trim(),
          subject,
          message: message.trim(),
        }),
      });
      if (!res.ok) throw new Error('Failed to send');
      setSubmitted(true);
    } catch {
      setError(
        lang === 'bn'
          ? 'মেসেজ পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
          : 'Could not send message right now. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 lg:px-6 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer font-semibold"
          >
            {lang === 'bn' ? 'হোম' : 'Home'}
          </button>
          <span>›</span>
          <span className="text-slate-800 dark:text-slate-100 font-bold">
            {lang === 'bn' ? 'যোগাযোগ করুন (Contact Us)' : 'Contact Us'}
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          {lang === 'bn' ? 'যোগাযোগ করুন' : 'Contact Us'}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
          {lang === 'bn' ? (
            <>
              যেকোনো প্রশ্ন, সমস্যা বা নতুন টুলের পরামর্শ সরাসরি <strong>{ownerConfig.ownerName}</strong>-এর কাছে পৌঁছে যাবে।{' '}
              {ownerConfig.brandName} ({ownerConfig.location}) সরাসরি পরিচালিত হয়।
            </>
          ) : (
            <>
              Questions, problems and suggestions all reach a real person ({ownerConfig.ownerName}).{' '}
              {ownerConfig.brandName} {ownerConfig.byline} is operated directly from {ownerConfig.location}.
            </>
          )}
        </p>
      </div>

      {/* Contact Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href={`mailto:${ownerConfig.supportEmail}`}
          className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-500 rounded-2xl p-5 transition-colors block shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center mb-3 shadow-sm">
            <Mail className="w-5 h-5" />
          </div>
          <div className="text-sm font-extrabold text-slate-900 dark:text-white">
            {lang === 'bn' ? 'সাধারণ সহায়তা (Email)' : 'General Support'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-2">
            {lang === 'bn'
              ? 'টুলস বা ফিচার সম্পর্কিত যেকোনো প্রশ্ন।'
              : 'Questions about tools, features, or custom requests.'}
          </p>
          <div className="text-sm font-bold text-violet-700 dark:text-violet-400 break-all">
            {ownerConfig.supportEmail}
          </div>
        </a>

        <a
          href={`tel:${ownerConfig.phone}`}
          className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 rounded-2xl p-5 transition-colors block shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-sm">
            <Phone className="w-5 h-5" />
          </div>
          <div className="text-sm font-extrabold text-slate-900 dark:text-white">
            {lang === 'bn' ? 'ফোন সাপোর্ট' : 'Phone Support'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-2">
            {lang === 'bn'
              ? 'কাজের সময়ে সরাসরি কল করুন।'
              : 'Direct call during working hours.'}
          </p>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {ownerConfig.phone}
          </div>
        </a>

        <a
          href={ownerConfig.websiteUrl}
          target="_blank"
          rel="noreferrer"
          className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-500 rounded-2xl p-5 transition-colors block shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center mb-3 shadow-sm">
            <Globe className="w-5 h-5" />
          </div>
          <div className="text-sm font-extrabold text-slate-900 dark:text-white">
            {lang === 'bn' ? 'SMART SUBHA ওয়েবসাইট' : 'SMART SUBHA Official Link'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-2">
            {lang === 'bn'
              ? 'অফিশিয়াল পোর্টাল ও প্রজেক্ট ভিজিট করুন।'
              : 'Visit SMART SUBHA digital portal.'}
          </p>
          <div className="text-sm font-bold text-sky-700 dark:text-sky-400 underline">
            {ownerConfig.websiteLabel}
          </div>
        </a>
      </div>

      {/* Main Split: Guidance + Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-xs">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'দ্রুত উত্তর পাওয়ার নিয়ম' : 'Getting a fast answer'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'bn'
                ? 'কোনো টুলে সমস্যা হলে মেসেজে নিচের ৪টি তথ্য দিলে দ্রুত সমাধান করা সহজ হয়:'
                : 'If a tool is not behaving as expected, including these four details helps resolve it in one reply:'}
            </p>
            <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li>{lang === 'bn' ? 'আপনি কোন টুলটি ব্যবহার করছিলেন' : 'Which tool you were using'}</li>
              <li>{lang === 'bn' ? 'কী করতে গিয়ে কী সমস্যা হয়েছে' : 'What you did and what happened instead'}</li>
              <li>{lang === 'bn' ? 'ফোন নাকি কম্পিউটার এবং কোন ব্রাউজার' : 'Phone or computer, and browser (Chrome, Edge, Safari)'}</li>
              <li>{lang === 'bn' ? 'কোনো এরর মেসেজ এলে সেটি লিখুন' : 'The exact error text, if any appeared'}</li>
            </ul>
            <p className="text-xs text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl p-3 font-medium">
              {lang === 'bn'
                ? 'অনুগ্রহ করে সাপোর্ট মেসেজে কখনো আধার, প্যান বা ব্যক্তিগত পরিচয়পত্র যুক্ত করবেন না।'
                : 'Please do not attach Aadhaar, PAN, or personal identity documents to support messages.'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2.5 text-xs text-slate-600 dark:text-slate-400 shadow-xs">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
              {lang === 'bn' ? 'ব্যবসায়িক তথ্য' : 'Business Information'}
            </h2>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div>
                  <strong className="text-slate-900 dark:text-slate-200">
                    {lang === 'bn' ? 'প্রতিষ্ঠানের নাম' : 'Business Name'}:
                  </strong>{' '}
                  {ownerConfig.brandName} ({ownerConfig.ownerName})
                </div>
                <div>
                  <strong className="text-slate-900 dark:text-slate-200">
                    {lang === 'bn' ? 'ইমেইল' : 'Email'}:
                  </strong>{' '}
                  {ownerConfig.supportEmail}
                </div>
                <div>
                  <strong className="text-slate-900 dark:text-slate-200">
                    {lang === 'bn' ? 'ফোন' : 'Phone'}:
                  </strong>{' '}
                  {ownerConfig.phone}
                </div>
                <div>
                  <strong className="text-slate-900 dark:text-slate-200">
                    {lang === 'bn' ? 'ঠিকানা' : 'Location'}:
                  </strong>{' '}
                  {ownerConfig.location}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 pt-1">
              <Clock className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div>
                  <strong className="text-slate-900 dark:text-slate-200">
                    {lang === 'bn' ? 'কাজের সময়' : 'Working Hours'}:
                  </strong>{' '}
                  {ownerConfig.workingHours}
                </div>
                <div>
                  <strong className="text-slate-900 dark:text-slate-200">
                    {lang === 'bn' ? 'উত্তরের সময়সীমা' : 'Response Time'}:
                  </strong>{' '}
                  {ownerConfig.responseTime}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">
            {lang === 'bn' ? 'সরাসরি মেসেজ পাঠান' : 'Send us a message'}
          </h2>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <h3 className="text-base font-extrabold text-emerald-900 dark:text-emerald-200">
                {lang === 'bn' ? 'মেসেজ সফলভাবে পাঠানো হয়েছে!' : 'Message Sent Successfully!'}
              </h3>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                {lang === 'bn'
                  ? `ধন্যবাদ, ${name}। আপনার বার্তাটি SMART SUBHA-র অ্যাডমিন ইনবক্সে জমা হয়েছে।`
                  : `Thank you, ${name}. Your message has been delivered directly to ${ownerConfig.ownerName}'s inbox.`}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setName('');
                  setEmail('');
                  setSubject('');
                  setMessage('');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
              >
                {lang === 'bn' ? 'আরও একটি মেসেজ পাঠান' : 'Send Another Message'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-semibold">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'আপনার নাম *' : 'Name *'}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={lang === 'bn' ? 'আপনার সম্পূর্ণ নাম লিখুন' : 'Your full name'}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'ইমেইল ঠিকানা *' : 'Email *'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'বিষয় *' : 'Subject *'}
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:border-violet-500"
                >
                  <option value="">{lang === 'bn' ? 'একটি বিষয় নির্বাচন করুন' : 'Select a topic'}</option>
                  <option value="General Question">
                    {lang === 'bn' ? 'সাধারণ প্রশ্ন' : 'General Question'}
                  </option>
                  <option value="Tool Not Working">
                    {lang === 'bn' ? 'টুল কাজ করছে না' : 'Tool Not Working'}
                  </option>
                  <option value="Feature Suggestion">
                    {lang === 'bn' ? 'নতুন ফিচার পরামর্শ' : 'Feature Suggestion'}
                  </option>
                  <option value="Other">{lang === 'bn' ? 'অন্যান্য' : 'Other'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'বিস্তারিত বার্তা *' : 'Message *'}
                </label>
                <textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    lang === 'bn'
                      ? 'আপনার প্রশ্ন বা সমস্যার কথা পরিষ্কারভাবে লিখুন...'
                      : 'Describe your question or issue clearly...'
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:border-violet-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold cursor-pointer disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                {submitting
                  ? lang === 'bn'
                    ? 'পাঠানো হচ্ছে...'
                    : 'Sending...'
                  : lang === 'bn'
                  ? 'মেসেজ পাঠান'
                  : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
