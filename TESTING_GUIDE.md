## 🧪 How to Test CodeMorph

### Prerequisites
- VS Code (latest stable)
- Node.js (v18+ recommended)
- Git installed

---

### Step 1: Clone the repository

```bash
git clone https://github.com/adx19/CodeMorph.git
cd CodeMorph
npm install
```

---

### Step 2: Compile the extension

```bash
npm run compile
```

If this succeeds without errors, the extension is ready to run.

---

### Step 3: Run the extension in VS Code

1. Open the **CodeMorph** folder in VS Code  
2. Press **F5**  
3. A new window will open: **Extension Development Host**

You should see a notification like:

```text
CodeMorph activated ✅
```

If you don’t see this, the extension is not running correctly.

---

### Step 4: Create a test Java file

In the **Extension Development Host** window:

Create a file named:
```text
Test.java
```

Paste the following Java code:

```java
public class Test {
    public static void main(String[] args) {
        for (int i = 0; i < 5; i++) {
            System.out.println(i);
        }
    }
}
```

---

### Step 5: Trigger conversion (Java → Python)

Rename the file:
```text
Test.java → Test.py
```

A popup should appear asking to convert.

- Click **Convert**
- Choose whether to **add comments** or **not**

✅ The file content should now be replaced with Python code.

---

### Step 6: Reverse conversion (Python → Java)

Rename the file back:
```text
Test.py → Test.java
```

Check that:
- Java syntax is valid
- Logic is preserved (loop, output, etc.)

---

### Step 7: Undo safety check

Press **Ctrl + Z** after conversion.

Confirm the original code is restored correctly.  
Undo should always reliably restore the previous contents.

---

### Step 8: Additional testing (optional)

Try:
- Files with multiple methods or classes
- Very small files (1–5 lines)
- Files without a `main` method
- Python → Java conversion first

---