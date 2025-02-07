let filePreview = document.getElementById("file-preview");
let textContent = "";
let extractedText = "";
let fileLoaded = false;
let chatInput = document.getElementById('chat-input');
let sendMessageButton = document.querySelector('.send-message');
let fileNameElement = document.getElementById("fileName");

// Function to handle PDF file input
document.getElementById("pdfInput").addEventListener("change", function(event) {
    try {
        const file = event.target.files[0];
        if (!file) return;

        filePreview.classList.remove("hidden");
        fileNameElement.textContent = "Loading...";
        chatInput.disabled = true;
        sendMessageButton.disabled = true;

        const reader = new FileReader();
        reader.onload = function() {
            const typedArray = new Uint8Array(reader.result);
            pdfjsLib.getDocument(typedArray).promise.then(pdf => {
                textContent = "";
                const pages = Array.from({ length: pdf.numPages }, (_, i) => i + 1);

                return Promise.all(
                    pages.map(num => pdf.getPage(num).then(page =>
                        page.getTextContent().then(text =>
                            textContent += text.items.map(s => s.str).join(" ") + "\n\n"
                        )
                    ))
                ).then(() => {
                    extractedText = textContent;
                    fileLoaded = true;
                    fileNameElement.textContent = file.name.substring(0, 50);
                    chatInput.disabled = false;
                    sendMessageButton.disabled = false;
                });
            });
        };
        reader.readAsArrayBuffer(file);
    } catch (fileError) {
        console.log(fileError);
    }
});

sendMessageButton.addEventListener('click', () => {
    if (!fileLoaded && filePreview.classList.contains("hidden") === false) {
        return; // Prevent sending if file is still loading
    }

    let userMessage = chatInput.value.trim();
    let actualMessage = userMessage;
    if (userMessage === '') return;

    if (fileLoaded) {
        userMessage = "From the text in the PDF: " + extractedText + " " + userMessage;
        fileLoaded = false;
    }

    const userMessageDiv = document.createElement('div');
    userMessageDiv.classList.add('message', 'user-message', 'flex', 'items-end', 'justify-end', 'items-start', 'gap-2');
    userMessageDiv.innerHTML = `
        <div class="message user-message flex items-end justify-end gap-2">
            <div class="message-content cursor-default bg-gray-800 text-sm rounded-xl p-2 px-3">
                ${actualMessage}
            </div>
        </div>
    `;
    document.querySelector('.messages').appendChild(userMessageDiv);
    chatInput.value = '';
    filePreview.classList.add('hidden');

    sendToAI(userMessage);
});

async function sendToAI(question) {
    try {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDsoOEqTTpgfP2HwwmD5RCqhWzXxCOi5Ps",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: question }] }] }),
            }
        );

        const result = await response.json();
        let ai_response = result.candidates[0].content.parts[0].text;

        const aiMessage = document.createElement("div");
        aiMessage.classList.add("message", "ai-message", "flex", "items-start", "gap-2");
        aiMessage.innerHTML = `
            <div class="message ai-message flex items-start gap-2">
                <div class="message-content bg-gray-900 text-sm text-gray-300 w-10/12 cursor-pointer hover:bg-gray-800 active:scale-95 transition-all rounded-lg p-2">
                    ${ai_response}
                </div>
            </div>
        `;

        document.querySelector('.messages').appendChild(aiMessage);
        document.querySelector('.messages').scrollTop = document.querySelector('.messages').scrollHeight;
    } catch (error) {
        console.error("Error in chat function:", error.message);
    }
                                                          }
