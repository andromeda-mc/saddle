# This version of Andromeda Saddle is discontinued

Although bug-fix PRs are still accepted, please continue developing Andromeda Saddle 2.

# Old Readme (Andromeda Saddle)

This README is work in progress!

## Building

### Prerequisites

- Node.js and NPM
- Git
- A way to host a web server (Using a python http server as a example here)

### Actual Building

1. Clone the repository `git clone https://github.com/andromeda-mc/saddle`
2. Navigate in the directory `cd saddle`
3. Install the dependencies `npm i`
4. Build the website `npm run build`  
   Use `npm run dev` instead for live reloading and a web server while developing

The HTML-Files are now in `public/`

### Hosting with Python

1. Navigate in the build folder `cd public`
2. Start a python web server `python -m http.server`

Your Andromeda Saddle instance is now running at `http://localhost:8000`

You should still switch to a professional web server like nginx or apache2.

