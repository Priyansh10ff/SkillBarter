# Skill Barter

Trade what you know for what you want to learn. One hour of teaching earns one hour of learning. No money changes hands.

---

## What it is

Skill Barter is a peer-to-peer skill exchange built on time credits. You post a skill you can teach, someone books a session with you, and when the session is done you earn credits. You spend those credits to book sessions with other people. Every session runs inside the app: video, screen share, a shared whiteboard and chat, so there are no external meeting links to pass around.

Every new member starts with 2 credits so they can learn before they have taught anything.

## Why we are building it

- **Learning outside a curriculum costs money most students do not have.** Courses, tutors and bootcamps are priced for people with income. Students and early-career people have time and skills, not cash.
- **Most people already know something worth teaching.** A second-year student who is good at React is a beginner at guitar. Someone fluent in Japanese wants to learn Figma. Those two people can help each other, but there is no simple way for them to find each other and trade fairly.
- **Free peer help does not scale because it is not reciprocal.** Discord servers and group chats run on goodwill. The same few people end up doing all the teaching and burn out. A credit system makes the exchange two-sided: you give an hour, you get an hour.
- **Every hour is worth the same.** An hour of calculus and an hour of cooking cost the same 1 credit. This keeps the system simple, removes haggling and treats everyone's time as equal.
- **Existing tools are scattered.** Finding a person, agreeing on a time, sharing a call link, drawing on a whiteboard and confirming the session happened usually takes four different apps. Skill Barter does it in one place.

## Who it is for

**Primary: college students**
Students who want to pick up skills their degree does not cover (a new framework, design, a language, an instrument, interview prep) and who have something of their own to offer in return. They have flexible hours, are comfortable on video and already learn from peers informally.

**Secondary: early-career developers and self-learners**
People in their first jobs or teaching themselves, who want short, focused 1:1 sessions with someone slightly ahead of them, rather than a full course.

**Also: hobbyists and language learners**
People who want regular conversation practice or casual instruction in music, art, cooking or fitness, and can teach their own hobby back.

**Who it is not for**
Professional tutoring businesses, paid coaching, or anyone looking to earn money. Credits cannot be bought, sold or cashed out.

## How it works

1. **Sign up and verify your email.** You get 2 starting credits.
2. **Fill in your profile.** Skills you can teach, skills you want to learn, the hours you are usually free.
3. **Post a listing** for something you can teach, with a length of 30, 60, 90 or 120 minutes. Cost is 1 credit per hour (30 minutes = 0.5 credits).
4. **Find something to learn.** Browse and search listings, or check the suggestions built from the skills you want and the skills other people want from you.
5. **Book a session.** The credits are taken from your balance and held, not paid out yet.
6. **Agree on a time.** Either side proposes a time, the other accepts or suggests another. Chat with the other person on the booking itself.
7. **Meet in the session room.** Video, audio, screen share, shared whiteboard and chat, only open to the two people in the booking.
8. **Confirm the session.** The learner marks it complete and the held credits go to the teacher. If the learner forgets, credits release automatically 48 hours after the scheduled end. If something went wrong, the learner can report it and the credits stay frozen until it is resolved.
9. **Review each other.** Both sides leave a 1 to 5 rating and a short comment.

If a booking is declined or cancelled before the session, the held credits go back to the learner.

## Core features

**Accounts and trust**
- Email and password sign up with email verification and disposable email blocking
- Password reset by email
- Public profiles with bio, skills offered and wanted, availability, rating, reviews, badges and session stats

**Listings and discovery**
- Create, edit and remove listings with category, tags and duration
- Search by keyword, filter by category, paginated results
- Suggested listings and suggested barter matches based on your skills

**Bookings and credits**
- Credits held on booking, released on completion, refunded on decline or cancel
- Time negotiation: propose, counter, accept
- Per-booking chat
- Automatic release after 48 hours, report a problem to freeze credits
- Wallet page with balance and a full history of every credit movement

**Session room**
- 1:1 video and audio with mute and camera controls
- Screen sharing
- Shared live whiteboard with colors and clear
- In-room text chat
- Access limited to the learner and teacher of that booking

**Community**
- Ratings and written reviews after each session
- Badges for milestones (first session taught, 5, 10 and 25 sessions, highly rated teacher)
- Leaderboard of top teachers

**Notifications**
- Real-time in-app notifications with a bell and history
- Emails for the important moments: new booking request, time accepted, credits received

## Principles

- **Equal time, equal value.** One hour is one credit, whatever the subject.
- **No money.** No payments, no buying credits, no cashing out.
- **Credits are never lost or created by accident.** Every movement is recorded and every balance can be traced back to its history.
- **Only the two people in a session can see it.** Rooms, chats and booking details are private to the learner and teacher.
- **One place for the whole exchange.** Discovery, scheduling, the session itself and the follow-up all happen in the app.

## Out of scope

- Payments, subscriptions or paid credit top-ups
- Group classes (sessions are 1:1)
- Recording sessions
- Native mobile apps (the web app is responsive and works on mobile browsers)
- Calendar sync with Google or Outlook

## Tech at a glance

| Layer | Choice |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express 5, Socket.IO |
| Database | MongoDB Atlas with Mongoose |
| Real-time video | WebRTC through PeerJS, with a self-hosted PeerServer |
| Auth | JWT, bcrypt password hashing, email verification with Nodemailer |
| Hosting | Vercel (client), Render (server), MongoDB Atlas (database) |

Full technical details are in [TECHNICAL.md](./TECHNICAL.md).
