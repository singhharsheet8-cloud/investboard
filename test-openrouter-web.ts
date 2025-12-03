/**
 * Test script for OpenRouter API with web search plugin
 * 
 * Run with: npx tsx test-openrouter-web.ts
 * 
 * Make sure OPENROUTER_API_KEY is set in your environment
 */

async function testOpenRouterWebSearch() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error("❌ OPENROUTER_API_KEY environment variable is not set");
    console.log("\nSet it with: export OPENROUTER_API_KEY=your_key_here");
    process.exit(1);
  }

  console.log("🔍 Testing OpenRouter API with web search...\n");

  const requestBody = {
    model: "openai/gpt-5-mini:online",
    messages: [
      {
        role: "user",
        content: "What is the current population of Chennai, India?"
      }
    ],
    plugins: [
      {
        id: "web",
        max_results: 5
        // optional: "engine": "exa"  // (by default engine = exa for models w/o native search)
      }
    ],
    stream: false
  };

  console.log("📤 Request:");
  console.log(JSON.stringify(requestBody, null, 2));
  console.log("\n" + "=".repeat(60) + "\n");

  try {
    const startTime = Date.now();
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Finance Dashboard Test"
      },
      body: JSON.stringify(requestBody)
    });

    const elapsed = Date.now() - startTime;
    
    console.log(`📥 Response Status: ${response.status} ${response.statusText}`);
    console.log(`⏱️  Response Time: ${elapsed}ms\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error Response:");
      console.error(errorText);
      return;
    }

    const data = await response.json();
    
    console.log("✅ Success! Full Response:");
    console.log(JSON.stringify(data, null, 2));
    
    // Extract the assistant's message
    const assistantMessage = data?.choices?.[0]?.message?.content;
    if (assistantMessage) {
      console.log("\n" + "=".repeat(60));
      console.log("\n📝 Assistant's Answer:");
      console.log(assistantMessage);
    }

    // Show usage info if available
    if (data?.usage) {
      console.log("\n📊 Token Usage:");
      console.log(`   Prompt tokens: ${data.usage.prompt_tokens}`);
      console.log(`   Completion tokens: ${data.usage.completion_tokens}`);
      console.log(`   Total tokens: ${data.usage.total_tokens}`);
    }

  } catch (error) {
    console.error("❌ Request failed:", error);
  }
}

testOpenRouterWebSearch();

