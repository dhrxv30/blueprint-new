const fs = require('fs');

async function runTest() {
  console.log("Creating dummy PRD...");
  const prdContent = `
# Project Name: Smart Task Manager

## Goals
Build a modern task management system that uses AI to prioritize tasks.

## Features
1. User Authentication (Login/Register via email)
2. Task Creation (Title, Description, Due Date)
3. AI Prioritization (Auto-assign high/medium/low priority based on text)
4. Dashboard (View all tasks in a Kanban board)

## Non-Functional Requirements
- Fast load times (< 2s)
- Secure data storage
- Responsive design
  `;
  
  fs.writeFileSync('dummy_prd.pdf', prdContent);

  console.log("Uploading to backend...");
  
  // Since we are running in Node, we can use the native fetch and FormData
  const blob = new Blob([fs.readFileSync('dummy_prd.pdf')], { type: 'application/pdf' });
  const form = new FormData();
  form.append('file', blob, 'dummy_prd.pdf');
  form.append('profileId', '00000000-0000-0000-0000-000000000000'); 
  form.append('projectName', 'Test Project AI');

  try {
    const res = await fetch('http://localhost:5000/api/prd/upload', {
      method: 'POST',
      body: form
    });
    
    const data = await res.json();
    console.log("Upload Response:", data);
    
    if (!data.jobId) {
      console.error("No jobId returned!");
      return;
    }
    
    console.log(`Polling job ${data.jobId}...`);
    let completed = false;
    while (!completed) {
      await new Promise(r => setTimeout(r, 5000));
      const statusRes = await fetch(`http://localhost:5000/api/prd/jobs/${data.jobId}/status`);
      const statusData = await statusRes.json();
      console.log(`Status: ${statusData.status}`);
      if (statusData.status === 'COMPLETED' || statusData.status === 'FAILED') {
        completed = true;
        console.log("Final Job State:", JSON.stringify(statusData, null, 2));
        
        if (statusData.status === 'COMPLETED') {
            console.log("Fetching Analysis...");
            const analysisRes = await fetch(`http://localhost:5000/api/projects/${data.projectId}/analysis`);
            const analysisData = await analysisRes.json();
            console.log("Tasks count:", analysisData.tasks?.length);
            console.log("Features count:", analysisData.features?.length);
            console.log("Architecture nodes:", analysisData.architecture?.nodes?.length);
            
            console.log("Analysis Output preview:", Object.keys(analysisData));
        }
      }
    }
    
  } catch (err) {
    console.error("Test failed:", err);
  }
}

runTest();
