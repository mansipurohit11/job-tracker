# 🎯 Job Tracker

### Because your brain has better things to do than remember which company ghosted you.

---

## What is this?

Job hunting is chaos. You apply to 20 places, hear back from 3, forget about 12, and somehow end up with 47 tabs open trying to remember if you already applied to that one company or if you just *thought* about applying while eating cereal at 2 AM.

**Job Tracker** is a clean, simple, no-nonsense web app that helps you keep track of all your job applications in one place. Add a company, pick a status, and boom — you're organized. Revolutionary, I know.

### Features:
- ✅ **Add, edit, and delete** applications
- 🏷️ **Status tracking** — Applied, In Review, Interview, Offer, Rejected, Withdrawn (the full emotional rollercoaster)
- 🔍 **Filter by status** — see only your interviews, or wallow in your rejections, your choice
- 📅 **Sort by date or company** — for the mildly Type-A among us
- 📊 **Import from Excel/CSV** — already tracking in a spreadsheet? Upload it and we'll handle the rest. Auto-detects your columns, matches your statuses, and imports everything in seconds
- 💾 **Data saved in your browser** — no sign-ups, no accounts, no "we'd love to send you newsletters"
- 🆓 **Completely free** — because job hunting is expensive enough

---

## 🖥️ Live Demo

Check it out here 👉 [**your-vercel-url-here**](#)

*(Replace this with your own deployed URL once you set it up!)*

---

## 🚀 Want your own? Here's how.

No coding knowledge needed. Seriously. If you can copy-paste and click buttons, you're overqualified for this.

### Prerequisites

You'll need:
- A **GitHub account** → [Sign up here](https://github.com/join) (free)
- A **Vercel account** → [Sign up here](https://vercel.com/signup) (also free, we love free)

That's it. No downloads. No terminal. No existential crisis.

---

### Step 1: Fork this repo

Click the **"Fork"** button at the top right of this page. ↗️

This creates your own personal copy of the project in your GitHub account. Think of it as adopting a pet project. Congratulations, it's yours now.

---

### Step 2: Create a Vercel account

1. Go to [**vercel.com**](https://vercel.com)
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"** (this is important — connect the same GitHub account you just forked with)
4. Authorize Vercel to access your GitHub. Don't worry, it's safe. Probably safer than your password habits.

---

### Step 3: Import and deploy

1. Once you're in Vercel, click **"Add New Project"**
2. You'll see a list of your GitHub repos — find **`job-tracker`** and click **"Import"**
3. Don't change any settings. Vercel is smart, it figures out what to do.
4. Click **"Deploy"**
5. Wait ~30 seconds. Go get water. Stay hydrated.
6. 🎉 **DONE.** Vercel gives you a live URL like `job-tracker-abc123.vercel.app`

**That's your personal job tracker.** Bookmark it. Tattoo it on your arm. Whatever works.

---

## 📝 How to use it

1. Open your Vercel URL
2. Click **"+ Add Application"**
3. Fill in the company name, role, status, and date
4. Hit **"Add"**
5. Repeat until you've documented your entire chaotic job search
6. Use the **filter pills** at the top to see applications by status
7. Click ✏️ to edit or 🗑️ to delete

Pro tip: Update the status as you progress through interviews. It's weirdly satisfying to move something to "Interview" or "Offer." Less satisfying for "Rejected," but hey, at least you're organized about it.

### Already tracking in Excel?
 
No need to start over! Click **"📊 Import Excel"**, upload your `.xlsx`, `.xls`, or `.csv` file, and the app will auto-detect your columns and import everything. It even matches status values like "Interviewed" → Interview, "Pending" → In Review, etc. Your spreadsheet era is officially over.

---

## ⚠️ Good to know

- Your data is stored in **your browser's localStorage**. This means:
  - ✅ It persists between visits (close the tab, come back later, still there)
  - ✅ It's private — nobody else can see your data
  - ❌ It does NOT sync across devices (laptop data ≠ phone data)
  - ❌ If you clear your browser data, it's gone. Don't do that.
- Use the **same browser** every time (always Chrome, or always Safari, etc.)

---

## 🛠️ For the nerds (Tech Stack)

- **React** + **Vite** — fast, modern, no drama
- **localStorage** — simple browser-based persistence
- **Vercel** — free hosting with auto-deploy on push
- **Zero dependencies** beyond React — because `node_modules` doesn't need to be heavier than your existential dread

---

## 🤝 Contributing

Found a bug? Have a feature idea? Want to add dark mode because you're a creature of the night?

1. Fork the repo
2. Create a branch (`git checkout -b cool-new-feature`)
3. Make your changes
4. Push and open a Pull Request
5. I'll review it between job applications 😄

---

## 💙 Why I made this

I was deep in the job search trenches and realized I was losing track of where I applied, what stage I was at, and which companies had ghosted me (looking at you, *every company ever*). So I built this for myself, shared it with a friend, and now I'm sharing it with you.

If this helps even one person stay slightly less chaotic during their job search, it was worth it.

**Good luck out there. You've got this. 💪**

---

## 📄 License

MIT — do whatever you want with it. Just don't sell it and claim you invented job tracking. That would be weird.

---

*Built with ☕ and mild frustration by [Mansi](https://github.com/mansipurohit11)*
