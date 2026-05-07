# WorkFlow - Daily Productivity Tracker

WorkFlow is a premium, minimal, and highly efficient daily task management application. Built with a clean **White & Purple** aesthetic, it uses a Single Page Application (SPA) architecture on the frontend and a robust PHP/MySQL backend.

**Click here http://workflow-app.lovestoblog.com/**

## Features
* **Dashboard Analytics:** Get a bird's-eye view of Today's Tasks, Completed, Pending, and Upcoming tasks.
* **Daily Work Log:** Keep a chronological record of your daily activities.
* **Advanced To-Do List:** Organize tasks by 'Pending', 'In Progress', 'Done', and an automated 'Missed' status.
* **Timeline View:** Visually track your upcoming schedule.
* **Calendar View:** A full-grid calendar to navigate tasks by specific dates.
* **Secure Authentication:** Built-in secure user registration and login system with password hashing.

##  Tech Stack
* **Frontend:** HTML5, CSS3 , Vanilla JavaScript (ES6+), FontAwesome Icons.
* **Backend:** PHP (RESTful API logic).
* **Database:** MySQL.
  
##  Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/yourusername/workflow-app.git](https://github.com/yourusername/workflow-app.git)

   Database Setup:

2. **Open XAMPP and start Apache and MySQL.**

Go to phpMyAdmin (http://localhost/phpmyadmin).

Create a new database named workflow_db.

Import the provided SQL structure to create users, tasks, and logs tables.

3. **Backend Configuration:**

Navigate to the backend/ folder.

Rename db.example.php to db.php.

Update your database credentials (username and password) inside db.php.

4. .**Run the App:**

Access the project via your local server: http://localhost/WORKFLOW-APP/index.html
