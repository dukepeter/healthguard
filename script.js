// script.js

document.addEventListener("DOMContentLoaded", () => {
  // Replace icons
  if (window.feather) {
    feather.replace();
  }

  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const form = document.getElementById("symptoms-form");
  const submitBtn = document.getElementById("submit-btn");
  const symptomsInput = document.getElementById("symptoms-input");
  const imagesInput = document.getElementById("symptomImages");
  const imagePreviews = document.getElementById("imagePreviews");
  const voiceBtn = document.getElementById("voice-btn");

  /* -------------------------------
     IMAGE PREVIEW (up to 3 images)
  --------------------------------*/
  if (imagesInput && imagePreviews) {
    imagesInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files || []).slice(0, 3);
      imagePreviews.innerHTML = "";

      files.forEach((file) => {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        img.alt = "Symptom image";
        img.className = "w-full h-20 object-cover rounded";
        imagePreviews.appendChild(img);
      });
    });
  }

  /* -------------------------------
     VOICE INPUT (browser speech API)
     Converts speech → text locally
  --------------------------------*/
  let recognition = null;
  let recognizing = false;

  if (voiceBtn && symptomsInput) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.lang = "en-US"; // You can later localize
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        recognizing = true;
        voiceBtn.classList.add("recording");
        voiceBtn.innerHTML = ""; // reset
        const icon = document.createElement("span");
        icon.textContent = "••";
        icon.className = "text-xs font-semibold";
        voiceBtn.appendChild(icon);
      };

      recognition.onend = () => {
        recognizing = false;
        voiceBtn.classList.remove("recording");
        voiceBtn.innerHTML = '<i data-feather="mic"></i>';
        if (window.feather) feather.replace();
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        alert("Voice input error. Please type instead or try again.");
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const existing = symptomsInput.value.trim();
        symptomsInput.value = existing
          ? `${existing} ${transcript}`
          : transcript;
      };

      voiceBtn.addEventListener("click", () => {
        if (!recognizing) {
          try {
            recognition.start();
          } catch (err) {
            console.error(err);
          }
        } else {
          recognition.stop();
        }
      });
    } else {
      // Browser does not support speech recognition
      voiceBtn.disabled = true;
      voiceBtn.title = "Voice input not supported in this browser";
    }
  }

  /* -------------------------------
     FORM SUBMIT → /api/triage
  --------------------------------*/
  if (form && submitBtn && symptomsInput) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const age = document.getElementById("age").value;
      const gender = document.getElementById("gender").value;
      const location = document.getElementById("location").value;
      const duration = document.getElementById("duration").value;
      const symptoms = symptomsInput.value.trim();

      if (!symptoms) {
        alert("Please describe your symptoms.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<span class="flex items-center gap-2"><span class="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>Analyzing...</span>';

      try {
        const payload = {
          symptoms,
          age,
          gender,
          duration,
          location, // kept for future use, not yet in triage.js
        };

        const response = await fetch("/api/triage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          console.error("Triage API status:", response.status);
          throw new Error("Bad response status");
        }

        const data = await response.json();

        // Basic validation
        if (!data || !data.risk_scores) {
          console.error("Unexpected triage response:", data);
          throw new Error("Invalid AI response");
        }

        // Store for results page
        sessionStorage.setItem("healthAssessment", JSON.stringify(data));

        window.location.href = "results.html";
      } catch (error) {
        console.error("Network or AI error:", error);
        alert("Network or AI error. Please try again.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "<span>Get Instant Risk Estimate</span>";
      }
    });
  }
});
