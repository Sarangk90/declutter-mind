import React, { useState, useEffect, useRef } from 'react';
import { Plus, Target, Zap, Clock, TrendingUp, CheckCircle, ArrowRight, Lightbulb, Grid3x3, Calendar, User, Send, AlertCircle } from 'lucide-react';

const CompleteActionPlanningTool = () => {
  // 5 Whys state
  const [problem, setProblem] = useState('');
  const [whys, setWhys] = useState(['', '', '', '', '']);
  const [followUpQuestions, setFollowUpQuestions] = useState(['', '', '', '', '']);
  const [currentWhyStep, setCurrentWhyStep] = useState(0);
  const [fiveWhysAnalysis, setFiveWhysAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);

  // Action Planning state
  const [currentStep, setCurrentStep] = useState(0);
  const [solutions, setSolutions] = useState([]);
  const [selectedSolution, setSelectedSolution] = useState(null);
  const [matrixPosition, setMatrixPosition] = useState({ impact: 5, effort: 5 });
  const [smartGoals, setSmartGoals] = useState([]);
  const [implementations, setImplementations] = useState([]);
  const [currentGoal, setCurrentGoal] = useState({
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    timebound: ''
  });
  const [currentImplementation, setCurrentImplementation] = useState({
    situation: '',
    action: '',
    frequency: 'daily'
  });
  
  const stepRefs = useRef([]);

  const steps = [
    { title: "5 Whys Analysis", icon: AlertCircle, description: "Identify the root cause of your problem" },
    { title: "Priority Matrix", icon: Grid3x3, description: "Rank solutions by impact vs effort" },
    { title: "SMART Goals", icon: Target, description: "Convert priorities into concrete goals" },
    { title: "Implementation", icon: Zap, description: "Create If-Then action plans" },
    { title: "Action Plan", icon: CheckCircle, description: "Review your complete action plan" }
  ];

  useEffect(() => {
    if (stepRefs.current[currentStep]) {
      stepRefs.current[currentStep].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep]);

  // 5 Whys Functions
  const generateFollowUpQuestion = async (stepIndex) => {
    setIsGeneratingQuestion(true);
    try {
      let prompt;
      if (stepIndex === 1) {
        prompt = `You are helping someone analyze a problem using the 5 Whys technique. 

Original problem: "${problem}"

Please create a natural, engaging "why" question that asks why this problem occurs. The question should:
- Start with "Why"
- Be conversational and specific to their situation
- Be more engaging than a generic template
- Stay focused on the "why" format

Respond with only the question, no additional text.`;
      } else {
        const previousAnswers = whys.slice(0, stepIndex - 1).filter(answer => answer.trim());
        const context = previousAnswers.map((answer, idx) => `Answer ${idx + 1}: "${answer}"`).join('\n');
        
        prompt = `You are helping someone analyze a problem using the 5 Whys technique. 

Original problem: "${problem}"
${context}

Please create a natural, engaging "why" question that asks why their most recent answer occurs. The question should:
- Start with "Why"
- Be conversational and specific to their response
- Be more engaging than a generic template
- Stay focused on the "why" format

Respond with only the question, no additional text.`;
      }

      const response = await fetch("http://localhost:3001/api/claude", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 200,
          messages: [
            { role: "user", content: prompt }
          ]
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response Error:', response.status, errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      const responseText = data.content[0].text;
      
      const newQuestions = [...followUpQuestions];
      newQuestions[stepIndex - 1] = responseText.trim();
      setFollowUpQuestions(newQuestions);
    } catch (error) {
      console.error('Error generating follow-up question:', error);
      console.error('Full error details:', error.message);
      
      // Try to get more details from the response if it's a fetch error
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', await error.response.text());
      }
      
      // Fallback to template
      const newQuestions = [...followUpQuestions];
      if (stepIndex === 1) {
        newQuestions[stepIndex - 1] = `Why does "${problem}" happen?`;
      } else {
        newQuestions[stepIndex - 1] = `Why does "${whys[stepIndex - 2]}" occur?`;
      }
      setFollowUpQuestions(newQuestions);
    }
    setIsGeneratingQuestion(false);
  };

  const handleProblemSubmit = async () => {
    if (problem.trim()) {
      setCurrentWhyStep(1);
      await generateFollowUpQuestion(1);
    }
  };

  const handleWhySubmit = async (index) => {
    if (whys[index].trim()) {
      if (index < 4) {
        setCurrentWhyStep(index + 2);
        await generateFollowUpQuestion(index + 2);
      } else {
        analyzeResponses();
      }
    }
  };

  const analyzeResponses = async () => {
    setIsAnalyzing(true);
    
    try {
      const prompt = `Analyze this 5 Whys problem-solving session:

Problem: ${problem}

Why 1: ${whys[0]}
Why 2: ${whys[1]}  
Why 3: ${whys[2]}
Why 4: ${whys[3]}
Why 5: ${whys[4]}

Please provide:
1. A clear identification of the root cause
2. Three actionable solutions to address this root cause
3. Key insights from the analysis

Format your response as JSON with the following structure:
{
  "rootCause": "Description of the root cause",
  "solutions": [
    {"title": "Solution 1", "description": "Detailed description"},
    {"title": "Solution 2", "description": "Detailed description"},
    {"title": "Solution 3", "description": "Detailed description"}
  ],
  "insights": ["Insight 1", "Insight 2", "Insight 3"]
}`;

      const response = await fetch("http://localhost:3001/api/claude", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            { role: "user", content: prompt }
          ]
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response Error (analyzeResponses):', response.status, errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API Response (analyzeResponses):', data);
      const responseText = data.content[0].text;
      
      // Handle Claude API JSON responses with markdown stripping
      let cleanResponse = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const result = JSON.parse(cleanResponse);
      
      setFiveWhysAnalysis(result);
      
      // Automatically populate solutions for next step
      const solutionsList = result.solutions.map((solution, index) => ({
        id: Date.now() + index,
        text: solution.title + ': ' + solution.description,
        impact: 0,
        effort: 0
      }));
      setSolutions(solutionsList);
      
    } catch (error) {
      console.error('Error analyzing responses:', error);
      setFiveWhysAnalysis({
        rootCause: "Unable to determine root cause due to an error.",
        solutions: [],
        insights: ["Please try again or review your responses."]
      });
    }
    setIsAnalyzing(false);
  };

  // Action Planning Functions
  const updateSolutionPriority = () => {
    if (selectedSolution) {
      const updated = solutions.map(sol => 
        sol.id === selectedSolution.id 
          ? { ...sol, impact: matrixPosition.impact, effort: matrixPosition.effort }
          : sol
      );
      setSolutions(updated);
      setSelectedSolution(null);
      setMatrixPosition({ impact: 5, effort: 5 });
    }
  };

  const getPriorityCategory = (impact, effort) => {
    if (impact >= 7 && effort <= 4) return { category: "Quick Wins", color: "#10B981", priority: 1 };
    if (impact >= 7 && effort >= 7) return { category: "Major Projects", color: "#F59E0B", priority: 2 };
    if (impact <= 4 && effort <= 4) return { category: "Fill-ins", color: "#6B7280", priority: 3 };
    return { category: "Thankless Tasks", color: "#EF4444", priority: 4 };
  };

  const generateSMARTGoal = async () => {
    if (!selectedSolution) return;
    
    try {
      const prompt = `Convert this solution into a SMART goal framework:

Solution: "${selectedSolution.text}"

Please create a SMART goal by breaking it down into:
- Specific: What exactly will be accomplished?
- Measurable: How will progress be measured?
- Achievable: What makes this realistic?
- Relevant: Why is this important?
- Time-bound: What's the deadline?

Respond with a JSON object:
{
  "specific": "Clear specific description",
  "measurable": "How to measure success",
  "achievable": "Why this is realistic", 
  "relevant": "Why this matters",
  "timebound": "Specific timeframe"
}`;

      const response = await fetch("http://localhost:3001/api/claude", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          messages: [{ role: "user", content: prompt }]
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response Error (generateSMARTGoal):', response.status, errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API Response (generateSMARTGoal):', data);
      let responseText = data.content[0].text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const result = JSON.parse(responseText);
      
      setCurrentGoal(result);
    } catch (error) {
      console.error('Error generating SMART goal:', error);
      setCurrentGoal({
        specific: selectedSolution.text,
        measurable: "Define success metrics",
        achievable: "Break into smaller steps",
        relevant: "Addresses root cause identified",
        timebound: "Set specific deadline"
      });
    }
  };

  const saveSMARTGoal = () => {
    if (selectedSolution && Object.values(currentGoal).some(val => val.trim())) {
      setSmartGoals([...smartGoals, {
        id: Date.now(),
        solution: selectedSolution.text,
        ...currentGoal
      }]);
      setCurrentGoal({ specific: '', measurable: '', achievable: '', relevant: '', timebound: '' });
      setSelectedSolution(null);
    }
  };

  const generateImplementationPlan = async () => {
    if (!selectedSolution) return;
    
    try {
      const prompt = `Create an implementation intention (If-Then plan) for this goal:

Goal: "${selectedSolution.text}"

Please suggest:
- A specific situation/trigger when this action should happen
- The exact action to take
- How often this should occur

Respond with JSON:
{
  "situation": "If this situation occurs...",
  "action": "Then I will do this specific action...",
  "frequency": "daily" or "weekly" or "monthly"
}`;

      const response = await fetch("http://localhost:3001/api/claude", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          messages: [{ role: "user", content: prompt }]
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response Error (generateImplementationPlan):', response.status, errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API Response (generateImplementationPlan):', data);
      let responseText = data.content[0].text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const result = JSON.parse(responseText);
      
      setCurrentImplementation(result);
    } catch (error) {
      console.error('Error generating implementation plan:', error);
      setCurrentImplementation({
        situation: "Define your trigger situation",
        action: "Define your specific action",
        frequency: "daily"
      });
    }
  };

  const saveImplementationPlan = () => {
    if (selectedSolution && currentImplementation.situation && currentImplementation.action) {
      setImplementations([...implementations, {
        id: Date.now(),
        goal: selectedSolution.text,
        ...currentImplementation
      }]);
      setCurrentImplementation({ situation: '', action: '', frequency: 'daily' });
      setSelectedSolution(null);
    }
  };

  const StepIndicator = () => (
    <div className="flex justify-center mb-8 px-4">
      <div className="flex items-center space-x-2 overflow-x-auto">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = currentStep === index;
          const isCompleted = currentStep > index;
          
          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center min-w-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isActive ? 'bg-white border-2 border-gray-600' : 
                  isCompleted ? 'bg-gray-600' : 'bg-gray-300'
                }`}>
                  <StepIcon className={`w-6 h-6 ${
                    isActive ? 'text-gray-600' : 
                    isCompleted ? 'text-white' : 'text-gray-500'
                  }`} />
                </div>
                <span className={`text-xs mt-1 text-center ${
                  isActive ? 'text-gray-800 font-medium' : 'text-gray-600'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-gray-400 mx-2 flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: '#CBCADB', fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#3F3F47' }}>
            Complete Problem-Solving Workflow
          </h1>
          <p className="text-lg" style={{ color: '#3F3F47' }}>
            From root cause analysis to concrete action plans - one seamless journey
          </p>
        </div>

        <StepIndicator />

        {/* Step 0: 5 Whys Analysis */}
        {currentStep === 0 && (
          <div className="bg-white rounded-xl p-6 shadow-lg" ref={el => stepRefs.current[0] = el}>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: '#3F3F47' }}>
              <AlertCircle className="w-6 h-6" />
              5 Whys Root Cause Analysis
            </h2>
            <p className="text-gray-600 mb-6">
              Let's start by identifying and analyzing your problem. We'll dig deep with five "why" questions to uncover the root cause.
            </p>
            
            {/* Problem Definition */}
            {currentWhyStep === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#3F3F47' }}>
                    What challenge are you facing?
                  </label>
                  <textarea
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleProblemSubmit();
                      }
                    }}
                    className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 resize-none"
                    style={{ borderColor: '#3F3F47', minHeight: '80px' }}
                    placeholder="Describe the problem you want to solve..."
                    rows={3}
                  />
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Quick examples:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "I keep procrastinating on important personal projects",
                      "Our new product launch has received less customer interest than expected",
                      "I'm experiencing frequent conflicts with my team about priorities",
                      "My team struggles to maintain code quality despite review processes",
                      "I feel constantly exhausted despite getting enough sleep"
                    ].map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setProblem(example)}
                        className="px-3 py-1 text-sm rounded-full border hover:bg-gray-100 transition-colors"
                        style={{ borderColor: '#3F3F47', color: '#3F3F47' }}
                      >
                        Example {index + 1}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={handleProblemSubmit}
                  className="w-full px-6 py-3 rounded-lg text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                  style={{ backgroundColor: '#3F3F47' }}
                  disabled={!problem.trim()}
                >
                  Start 5 Whys Analysis
                </button>
              </div>
            )}

            {/* Problem Summary */}
            {currentWhyStep > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-sm mb-2" style={{ color: '#3F3F47' }}>Problem:</h3>
                <p className="text-sm">{problem}</p>
              </div>
            )}

            {/* Why Questions */}
            {[1, 2, 3, 4, 5].map((num) => (
              currentWhyStep >= num && (
                <div key={num} className="mb-6 p-4 border-l-4 border-blue-500 bg-blue-50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-sm" 
                         style={{ backgroundColor: '#3F3F47' }}>
                      {num}
                    </div>
                    <h3 className="text-lg font-medium" style={{ color: '#3F3F47' }}>
                      Why #{num}
                    </h3>
                  </div>
                  
                  {currentWhyStep === num ? (
                    <div>
                      {isGeneratingQuestion ? (
                        <div className="mb-3 flex items-center gap-2">
                          <div className="flex">
                            <div className="w-1 h-1 rounded-full bg-gray-400 animate-bounce mx-0.5" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1 h-1 rounded-full bg-gray-400 animate-bounce mx-0.5" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1 h-1 rounded-full bg-gray-400 animate-bounce mx-0.5" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span className="text-sm" style={{ color: '#3F3F47' }}>Thinking...</span>
                        </div>
                      ) : (
                        <p className="mb-3 text-sm font-medium" style={{ color: '#3F3F47' }}>
                          {followUpQuestions[num - 1] || 
                           (num === 1 ? `Why does "${problem}" happen?` : 
                            `Why does "${whys[num - 2]}" occur?`)}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={whys[num - 1]}
                          onChange={(e) => {
                            const newWhys = [...whys];
                            newWhys[num - 1] = e.target.value;
                            setWhys(newWhys);
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleWhySubmit(num - 1);
                            }
                          }}
                          className="flex-1 px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2"
                          style={{ borderColor: '#3F3F47' }}
                          placeholder="Enter your answer..."
                        />
                        <button
                          onClick={() => handleWhySubmit(num - 1)}
                          className="px-4 py-3 rounded-lg text-white flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                          style={{ backgroundColor: '#3F3F47' }}
                          disabled={!whys[num - 1].trim() || isGeneratingQuestion}
                        >
                          {num === 5 ? 'Analyze' : 'Next'}
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : currentWhyStep > num ? (
                    <div>
                      <p className="text-sm font-medium mb-2" style={{ color: '#3F3F47' }}>
                        {followUpQuestions[num - 1] || 
                         (num === 1 ? `Why does "${problem}" happen?` : 
                          `Why does "${whys[num - 2]}" occur?`)}
                      </p>
                      <p className="text-sm">{whys[num - 1]}</p>
                    </div>
                  ) : null}
                </div>
              )
            ))}

            {/* Analysis Loading */}
            {isAnalyzing && (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <div className="w-2 h-2 rounded-full bg-gray-600 animate-bounce mx-1" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-600 animate-bounce mx-1" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-600 animate-bounce mx-1" style={{ animationDelay: '300ms' }}></div>
                </div>
                <p className="text-lg" style={{ color: '#3F3F47' }}>
                  Analyzing your responses and generating solutions...
                </p>
              </div>
            )}

            {/* Analysis Results */}
            {fiveWhysAnalysis && (
              <div className="mt-8 space-y-6">
                <div className="text-center mb-6">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-xl font-bold" style={{ color: '#3F3F47' }}>
                    Root Cause Analysis Complete!
                  </h3>
                </div>
                
                {/* Root Cause */}
                <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <h4 className="font-bold text-red-800">Root Cause</h4>
                  </div>
                  <p className="text-red-700">{fiveWhysAnalysis.rootCause}</p>
                </div>

                {/* Solutions Preview */}
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-green-600" />
                    <h4 className="font-bold text-green-800">Generated Solutions</h4>
                  </div>
                  <div className="space-y-2">
                    {fiveWhysAnalysis.solutions.map((solution, index) => (
                      <div key={index} className="text-sm text-green-700">
                        <span className="font-medium">{solution.title}:</span> {solution.description}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-8 py-3 rounded-lg text-white font-semibold hover:opacity-90 transition-all"
                    style={{ backgroundColor: '#3F3F47' }}
                  >
                    Next: Prioritize Solutions
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Priority Matrix */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl p-6 shadow-lg" ref={el => stepRefs.current[1] = el}>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: '#3F3F47' }}>
              <Grid3x3 className="w-6 h-6" />
              Action Priority Matrix
            </h2>
            <p className="text-gray-600 mb-6">
              Rate each solution by Impact vs Effort. This helps identify quick wins and major projects.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Solutions List */}
              <div>
                <h3 className="font-semibold mb-3" style={{ color: '#3F3F47' }}>Solutions from 5 Whys Analysis:</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {solutions.map((solution) => {
                    const priority = solution.impact > 0 ? getPriorityCategory(solution.impact, solution.effort) : null;
                    return (
                      <div
                        key={solution.id}
                        onClick={() => {
                          setSelectedSolution(solution);
                          setMatrixPosition({ impact: solution.impact || 5, effort: solution.effort || 5 });
                        }}
                        className={`p-3 rounded-lg cursor-pointer border-2 ${
                          selectedSolution?.id === solution.id ? 'border-gray-600 bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-sm">{solution.text}</div>
                        {priority && (
                          <div className="text-xs mt-1" style={{ color: priority.color }}>
                            {priority.category}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Matrix Controls */}
              <div>
                {selectedSolution && (
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-sm mb-2">Rating:</div>
                      <div className="text-sm">{selectedSolution.text}</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Impact: {matrixPosition.impact}/10
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={matrixPosition.impact}
                        onChange={(e) => setMatrixPosition(prev => ({...prev, impact: parseInt(e.target.value)}))}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500 mt-1">1 = Low impact, 10 = High impact</div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Effort: {matrixPosition.effort}/10
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={matrixPosition.effort}
                        onChange={(e) => setMatrixPosition(prev => ({...prev, effort: parseInt(e.target.value)}))}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500 mt-1">1 = Low effort, 10 = High effort</div>
                    </div>

                    <div className="p-3 rounded-lg" style={{ backgroundColor: getPriorityCategory(matrixPosition.impact, matrixPosition.effort).color + '20' }}>
                      <div className="font-medium text-sm" style={{ color: getPriorityCategory(matrixPosition.impact, matrixPosition.effort).color }}>
                        {getPriorityCategory(matrixPosition.impact, matrixPosition.effort).category}
                      </div>
                    </div>

                    <button
                      onClick={updateSolutionPriority}
                      className="w-full py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Save Rating
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!solutions.every(s => s.impact > 0)}
                className="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {solutions.every(s => s.impact > 0) ? 'Next: Create SMART Goals' : `Rate all ${solutions.length} solutions to continue`}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: SMART Goals */}
        {currentStep === 2 && (
          <div className="bg-white rounded-xl p-6 shadow-lg" ref={el => stepRefs.current[2] = el}>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: '#3F3F47' }}>
              <Target className="w-6 h-6" />
              Create SMART Goals
            </h2>
            <p className="text-gray-600 mb-6">
              Convert your prioritized solutions into Specific, Measurable, Achievable, Relevant, and Time-bound goals.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Priority Solutions */}
              <div>
                <h3 className="font-semibold mb-3" style={{ color: '#3F3F47' }}>Your Prioritized Solutions:</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {solutions
                    .sort((a, b) => getPriorityCategory(a.impact, a.effort).priority - getPriorityCategory(b.impact, b.effort).priority)
                    .map((solution) => {
                      const priority = getPriorityCategory(solution.impact, solution.effort);
                      const hasGoal = smartGoals.some(goal => goal.solution === solution.text);
                      
                      return (
                        <div
                          key={solution.id}
                          onClick={() => !hasGoal && setSelectedSolution(solution)}
                          className={`p-3 rounded-lg border-2 ${
                            hasGoal ? 'border-green-200 bg-green-50 opacity-75' :
                            selectedSolution?.id === solution.id ? 'border-gray-600 bg-gray-50 cursor-pointer' : 
                            'border-gray-200 hover:border-gray-400 cursor-pointer'
                          }`}
                        >
                          <div className="text-sm">{solution.text}</div>
                          <div className="flex justify-between items-center mt-1">
                            <div className="text-xs" style={{ color: priority.color }}>
                              {priority.category}
                            </div>
                            {hasGoal && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* SMART Goal Builder */}
              <div>
                {selectedSolution && (
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-sm mb-2">Creating SMART goal for:</div>
                      <div className="text-sm">{selectedSolution.text}</div>
                      <button
                        onClick={generateSMARTGoal}
                        className="mt-2 text-xs text-blue-600 hover:underline"
                      >
                        Generate with AI
                      </button>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(currentGoal).map(([key, value]) => (
                        <div key={key}>
                          <label className="block text-sm font-medium mb-1 capitalize">
                            {key}: 
                          </label>
                          <textarea
                            value={value}
                            onChange={(e) => setCurrentGoal(prev => ({...prev, [key]: e.target.value}))}
                            className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                            rows={2}
                            placeholder={`Enter ${key} details...`}
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={saveSMARTGoal}
                      disabled={!Object.values(currentGoal).some(val => val.trim())}
                      className="w-full py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                    >
                      Save SMART Goal
                    </button>
                  </div>
                )}
              </div>
            </div>

            {smartGoals.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-3" style={{ color: '#3F3F47' }}>Saved Goals:</h3>
                <div className="text-sm text-gray-600">
                  {smartGoals.length} goal(s) created
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t">
              <button
                onClick={() => setCurrentStep(3)}
                disabled={smartGoals.length === 0}
                className="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {smartGoals.length > 0 ? 'Next: Create Implementation Plans' : 'Create at least one SMART goal to continue'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Implementation Plans */}
        {currentStep === 3 && (
          <div className="bg-white rounded-xl p-6 shadow-lg" ref={el => stepRefs.current[3] = el}>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" style={{ color: '#3F3F47' }}>
              <Zap className="w-6 h-6" />
              Implementation Plans
            </h2>
            <p className="text-gray-600 mb-6">
              Create If-Then implementation intentions for your goals. These specific trigger-action plans dramatically improve follow-through.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Goals List */}
              <div>
                <h3 className="font-semibold mb-3" style={{ color: '#3F3F47' }}>Your SMART Goals:</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {smartGoals.map((goal) => {
                    const hasImplementation = implementations.some(impl => impl.goal === goal.solution);
                    
                    return (
                      <div
                        key={goal.id}
                        onClick={() => !hasImplementation && setSelectedSolution({ text: goal.solution })}
                        className={`p-3 rounded-lg border-2 ${
                          hasImplementation ? 'border-green-200 bg-green-50 opacity-75' :
                          selectedSolution?.text === goal.solution ? 'border-gray-600 bg-gray-50 cursor-pointer' : 
                          'border-gray-200 hover:border-gray-400 cursor-pointer'
                        }`}
                      >
                        <div className="text-sm font-medium">{goal.solution}</div>
                        <div className="text-xs text-gray-500 mt-1">{goal.specific}</div>
                        {hasImplementation && (
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span className="text-xs text-green-600">Implementation ready</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Implementation Builder */}
              <div>
                {selectedSolution && (
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-sm mb-2">Creating implementation plan for:</div>
                      <div className="text-sm">{selectedSolution.text}</div>
                      <button
                        onClick={generateImplementationPlan}
                        className="mt-2 text-xs text-blue-600 hover:underline"
                      >
                        Generate with AI
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        IF (Situation/Trigger):
                      </label>
                      <textarea
                        value={currentImplementation.situation}
                        onChange={(e) => setCurrentImplementation(prev => ({...prev, situation: e.target.value}))}
                        className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                        rows={2}
                        placeholder="When this situation occurs..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        THEN (Specific Action):
                      </label>
                      <textarea
                        value={currentImplementation.action}
                        onChange={(e) => setCurrentImplementation(prev => ({...prev, action: e.target.value}))}
                        className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                        rows={2}
                        placeholder="I will do this specific action..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Frequency:
                      </label>
                      <select
                        value={currentImplementation.frequency}
                        onChange={(e) => setCurrentImplementation(prev => ({...prev, frequency: e.target.value}))}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="as-needed">As needed</option>
                      </select>
                    </div>

                    <button
                      onClick={saveImplementationPlan}
                      disabled={!currentImplementation.situation.trim() || !currentImplementation.action.trim()}
                      className="w-full py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                    >
                      Save Implementation Plan
                    </button>
                  </div>
                )}
              </div>
            </div>

            {implementations.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-3" style={{ color: '#3F3F47' }}>Saved Implementation Plans:</h3>
                <div className="text-sm text-gray-600">
                  {implementations.length} implementation plan(s) created
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t">
              <button
                onClick={() => setCurrentStep(4)}
                disabled={implementations.length === 0}
                className="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {implementations.length > 0 ? 'Next: Review Complete Action Plan' : 'Create at least one implementation plan to continue'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Complete Action Plan */}
        {currentStep === 4 && (
          <div className="bg-white rounded-xl p-6 shadow-lg" ref={el => stepRefs.current[4] = el}>
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#3F3F47' }}>
                Your Complete Action Plan is Ready!
              </h2>
              <p className="text-gray-600">
                From root cause to concrete actions - you now have a complete roadmap to solve your problem.
              </p>
            </div>

            <div className="space-y-6">
              {/* Original Problem */}
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <h3 className="font-bold mb-2 text-blue-800">Original Problem</h3>
                <p className="text-blue-700">{problem}</p>
              </div>

              {/* Root Cause */}
              {fiveWhysAnalysis && (
                <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <h3 className="font-bold mb-2 text-red-800">Root Cause Identified</h3>
                  <p className="text-red-700">{fiveWhysAnalysis.rootCause}</p>
                </div>
              )}

              {/* Priority Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Grid3x3 className="w-5 h-5" />
                  Priority Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {['Quick Wins', 'Major Projects', 'Fill-ins', 'Thankless Tasks'].map(category => {
                    const count = solutions.filter(s => getPriorityCategory(s.impact, s.effort).category === category).length;
                    const colors = { 'Quick Wins': '#10B981', 'Major Projects': '#F59E0B', 'Fill-ins': '#6B7280', 'Thankless Tasks': '#EF4444' };
                    return (
                      <div key={category} className="p-2 bg-white rounded border" style={{ borderLeft: `4px solid ${colors[category]}` }}>
                        <div className="font-medium">{count}</div>
                        <div className="text-xs text-gray-500">{category}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SMART Goals */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  SMART Goals ({smartGoals.length})
                </h3>
                <div className="space-y-3">
                  {smartGoals.map((goal) => (
                    <div key={goal.id} className="p-3 bg-white rounded border-l-4 border-blue-500">
                      <div className="font-medium text-sm">{goal.specific}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        📏 {goal.measurable} | ⏰ {goal.timebound}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Implementation Plans */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  If-Then Plans ({implementations.length})
                </h3>
                <div className="space-y-3">
                  {implementations.map((impl) => (
                    <div key={impl.id} className="p-3 bg-white rounded border-l-4 border-green-500">
                      <div className="text-sm">
                        <span className="font-medium">IF</span> {impl.situation}
                      </div>
                      <div className="text-sm mt-1">
                        <span className="font-medium">THEN</span> {impl.action}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 capitalize">
                        📅 {impl.frequency}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Steps */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-bold mb-2 text-green-800">Recommended Next Steps:</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Start with your Quick Wins for immediate momentum</li>
                  <li>• Schedule calendar reminders for your If-Then triggers</li>
                  <li>• Set up a weekly review to track progress</li>
                  <li>• Consider using a task manager or habit tracker</li>
                  <li>• Revisit and adjust your plan as you learn and progress</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  // Reset all state
                  setProblem('');
                  setWhys(['', '', '', '', '']);
                  setFollowUpQuestions(['', '', '', '', '']);
                  setCurrentWhyStep(0);
                  setFiveWhysAnalysis(null);
                  setCurrentStep(0);
                  setSolutions([]);
                  setSmartGoals([]);
                  setImplementations([]);
                  setSelectedSolution(null);
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Start New Problem-Solving Journey
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompleteActionPlanningTool;