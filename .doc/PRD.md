# Product Requirements Document (PRD)

## Product Name

Working title: **Cycle-Aware AI Planner**

A productivity and health planning application that generates and manages daily tasks based on a user’s menstrual cycle phases, goals, and lifestyle. The system uses AI to dynamically adapt task intensity and scheduling across the menstrual cycle.

----------

# 1. Product Overview

Cycle-Aware AI Planner is an AI-powered task manager that integrates **cycle tracking, goal planning, and adaptive scheduling**.

The system:

-   Tracks menstrual cycle data
    
-   Predicts hormonal phases
    
-   Generates personalized plans
    
-   Adjusts task intensity based on cycle phase
    
-   Allows conversational modification of tasks using AI
    

Example user goal:

> “I want to lose weight by the end of the year.”

The system converts this goal into **daily actionable tasks** such as:

-   cardio sessions
    
-   hydration reminders
    
-   workouts
    
-   recovery activities
    
-   meal reminders
    

Task intensity automatically adapts based on cycle phase.

Example:

Follicular phase:

-   higher energy workouts
    

Luteal phase:

-   lighter workouts and recovery activities
    

----------

# 2. Target Users

Primary users:

Women who want:

-   structured routines
    
-   cycle-aware planning
    
-   adaptive workout or lifestyle plans
    

User segments:

1.  Fitness-focused users
    
2.  Productivity-focused users
    
3.  Women tracking hormonal patterns
    
4.  Users who want AI-driven life planning
    

----------

# 3. Core Problem

Current apps either:

Cycle tracking apps (e.g. Flo, Clue):

-   Track data but don’t translate it into actionable planning.
    

Task managers:

-   Plan tasks but ignore biological cycles.
    

Users must manually adjust plans based on how they feel.

The product solves this by creating:

**a cycle-aware AI planning system.**

----------

# 4. Key Product Principles

1.  Planning should adapt to hormonal phases.
    
2.  AI should simplify planning rather than increase complexity.
    
3.  Tasks should be editable through conversation.
    
4.  Calendar integration should make planning visible in the user’s daily life.
    

----------

# 5. Core Features

## 5.1 Authentication

Users sign up and log in using Supabase Auth.

Supported methods:

-   Email + password
    
-   Google OAuth (optional future improvement)
    

Authentication provider:

Supabase Auth

----------

# 5.2 Onboarding Flow

During onboarding the system collects basic information.

Steps:

### Step 1 — Account creation

User signs up or logs in.

### Step 2 — Goal setup

User defines a primary goal.

Examples:

-   lose weight
    
-   get fitter
    
-   improve productivity
    
-   build healthy habits
    

### Step 3 — Cycle information

User provides:

-   last period start date
    
-   average cycle length
    
-   average period length
    

### Step 4 — Lifestyle information

User enters:

-   sleep schedule
    
-   activity level
    
-   work schedule
    
-   preferred workout types
    

### Step 5 — Plan generation

The AI generates an **initial yearly or multi-month plan**.

----------

# 6. Cycle Tracking Module

The app must include a built-in period tracker.

Users can log daily cycle data.

Data collected:

Cycle basics:

-   period start date
    
-   period end date
    
-   cycle length
    

Daily flow tracking:

-   light
    
-   medium
    
-   heavy
    

Optional symptoms:

-   cramps
    
-   headache
    
-   fatigue
    
-   mood swings
    
-   cravings
    
-   bloating
    

Optional energy level:

-   low
    
-   medium
    
-   high
    

This data helps improve predictions and AI adjustments.

----------

# 7. Cycle Phase Prediction

The system calculates cycle phases.

Phases:

1.  Menstrual
    
2.  Follicular
    
3.  Ovulation
    
4.  Luteal
    

Each phase has associated:

-   energy level
    
-   recommended activity intensity
    
-   suggested task types
    

Example mapping:

Menstrual phase:

-   recovery tasks
    
-   light movement
    
-   rest
    

Follicular phase:

-   learning tasks
    
-   high energy workouts
    

Ovulation:

-   peak performance tasks
    
-   intense workouts
    
-   social activities
    

Luteal:

-   moderate intensity
    
-   focused tasks
    
-   lower stress activities
    

----------

# 8. AI Planning System

AI is responsible for generating and adjusting plans.

LLM used:

Gemini

Responsibilities:

-   generate initial plans
    
-   adjust tasks based on cycle phase
    
-   modify tasks when user interacts
    
-   explain changes
    

Inputs to AI:

-   user goal
    
-   cycle phase
    
-   lifestyle data
    
-   task completion history
    
-   sleep and energy signals
    

Outputs:

-   structured tasks
    
-   recommendations
    
-   schedule changes
    

----------

# 9. Task Management System

Tasks are the core unit of the system.

Each task contains:

-   title
    
-   description
    
-   duration
    
-   scheduled time
    
-   intensity level
    
-   phase context
    
-   completion status
    

Example task:

Title:  
30 minute cardio

Phase context:  
Follicular

Duration:  
30 minutes

Intensity:  
Medium-high

----------

# 10. AI Task Editing

Each task includes an **“Ask AI” button**.

When activated, the AI receives contextual information:

Context includes:

-   task details
    
-   current cycle phase
    
-   user goal
    
-   completion history
    

Users can modify tasks conversationally.

Examples:

User commands:

-   “Make this easier today”
    
-   “Move this to tomorrow”
    
-   “Replace with yoga”
    
-   “I only have 15 minutes”
    

AI updates the task accordingly.

----------

# 11. Phase-Level AI Chat

Users can chat with AI at the **phase level**.

Example:

User opens the **Luteal phase dashboard**.

AI receives context including:

-   current phase
    
-   predicted energy levels
    
-   current week’s tasks
    
-   user goal
    

Users can ask questions like:

-   “Adjust this week’s plan for PMS.”
    
-   “Reduce workout intensity.”
    
-   “Add recovery activities.”
    

AI updates tasks across multiple days if necessary.

----------

# 12. Task Scheduling and Calendar Integration

Tasks are scheduled automatically.

Primary view:

In-app task list and planner.

Optional integration:

Google Calendar.

Calendar integration allows tasks to appear alongside other daily events.

Calendar sync is **optional for MVP**.

----------

# 13. Energy Forecast

The app predicts upcoming energy levels based on cycle phase.

Example display:

Today:  
Medium energy

Tomorrow:  
High energy

3 days later:  
Possible PMS window

This helps users understand why task intensity changes.

----------

# 14. Dashboard

Main dashboard shows:

-   today’s tasks
    
-   current cycle phase
    
-   energy prediction
    
-   upcoming tasks
    
-   quick access to AI chat
    

----------

# 15. Technical Architecture

Frontend:

Next.js  
TypeScript

Backend:

Supabase

Database:

Supabase PostgreSQL

Authentication:

Supabase Auth

AI Integration:

Gemini API

Hosting:

Vercel

----------

# 16. Database Models (Simplified)

Users

-   id
    
-   email
    
-   created_at
    

UserProfile

-   user_id
    
-   goal
    
-   sleep_schedule
    
-   activity_level
    

CycleData

-   id
    
-   user_id
    
-   date
    
-   flow_level
    
-   symptoms
    
-   energy_level
    

CyclePrediction

-   user_id
    
-   phase
    
-   predicted_energy
    
-   date
    

Tasks

-   id
    
-   user_id
    
-   title
    
-   description
    
-   scheduled_date
    
-   duration
    
-   intensity
    
-   phase_context
    
-   completed
    

----------

# 17. MVP Scope

The MVP should include:

Authentication  
Onboarding  
Cycle tracking  
Phase prediction  
AI-generated task plan  
Task list  
AI task modification

Excluded from MVP:

Advanced analytics  
Wearable integrations  
Social features  
Multi-goal planning

----------

# 18. Future Enhancements

Potential improvements after MVP:

-   wearable data integration
    
-   sleep tracking
    
-   adaptive nutrition planning
    
-   community features
    
-   habit streak tracking
    
-   deeper AI coaching
    

----------

# 19. Success Metrics

Early indicators of success:

-   onboarding completion rate
    
-   task completion rate
    
-   weekly active users
    
-   AI interaction frequency
    
-   cycle logging consistency
    

----------

# 20. Product Vision

The long-term vision is to build:

**A cycle-aware AI life planner that adapts daily routines to a user’s biological rhythms.**

The system should function as a personalized assistant that helps users plan workouts, habits, and productivity in alignment with their hormonal cycles.
