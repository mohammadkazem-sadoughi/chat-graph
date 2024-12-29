This is a chatbot. It's like ChatGPT, but with some unique features.

Have you ever been using ChatGPT and wanted to explore a side thought without losing your main conversation? What do we do? Probably copy-pasting messages and then deleting them so your main chat LLM won't be distracted?

Here's what makes our chatbot special:

1. **Graph View**: Your chat history is shown as an interactive graph. Each history message is a node, and you can click on any of them to start a new chat branch. It's like creating alternate timelines for your conversations!

2. **Fork and Delete**: Start new chats from any point in your conversation history. Don't like a particular branch? Just delete it.

3. **All Local**: No need for internet - everything runs on your machine with a compact open-source model. Your conversations stay private and secure.

4. **Super Easy Setup**: Just two commands and you're ready to chat. No need to go to 5 different websites first to get a bunch of keys, etc.

![ChatGraph Demo](documents/demo.gif)

## Prerequisites

- macOS
- At least 5GB of free disk space
- Homebrew (Package Manager for macOS)
  ```bash
  # Install Homebrew if you haven't already
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  ```

- Git
  ```bash
  # Install Git using Homebrew
  brew install git
  ```

That's it! Everything else (Python, Node.js, npm, etc.) will be automatically installed during setup.

## Using ChatGraph

**Note: Currently only works on Mac**

1. Open Terminal
2. Clone the repository and navigate to the project directory:

```bash
git clone https://github.com/mohammadkazem-sadoughi/ChatGraph
cd chat-graph
```

3. Set up the environment (only needs to be done once):

```bash
make setup
```

This will:
- Check system requirements (including minimum 5GB free disk space)
- Install and configure required dependencies:
  - Python 3.11 (if not already installed)
  - Node.js v16+ and npm (if not already installed)
- Install and start Ollama service
- Download the phi3 language model (~4GB)
- Set up Python virtual environment and install backend dependencies
- Install frontend Node.js dependencies

> ⚠️ **Important Note**  
> The initial setup might take several minutes, especially downloading the language model (~4GB).
> Please ensure you have a stable internet connection and sufficient disk space.

4. Run the application (do this each time you want to use ChatGraph):

```bash
make run
```

> 🔒 **Security Alert: fsevents.node**  
> On first run, macOS might show a security warning about "fsevents.node". This is normal and safe for development:
> - `fsevents` is a legitimate macOS file-watching module used by React's development server
> - It's essential for features like hot-reloading (auto-updating while you code)
> - This warning only appears in development, not in production builds
>
> **To resolve:**
> 1. Open System Settings → Privacy & Security
> 2. Scroll down to the warning message about "fsevents.node"
> 3. Click "Allow Anyway"
> 4. Run `make run` again
>
> If the warning persists:
> 1. Close your current terminal
> 2. Open a new terminal window
> 3. Navigate back to the project directory: `cd path/to/ChatGraph`
> 4. Try `make run` again

5. Open your browser and go to: `http://localhost:3000`
6. When you're done, clean up with:

```bash
make clean
```