/**
 * David Agent - Data Analyst
 * 
 * David is responsible for:
 * - Processing and analyzing data
 * - Creating data visualizations and dashboards
 * - Extracting insights and patterns from data
 * - Performing statistical analysis
 * - Building data pipelines
 */

import { BaseAgent, AgentConfig } from './BaseAgent';
import {
  AgentMessage,
  AgentRole,
  Task,
  MessageType,
  TaskStatus,
} from './MessageProtocol';

const DAVID_SYSTEM_PROMPT = `You are David, an experienced Data Analyst with expertise in data processing, analysis, and visualization.

Your responsibilities:
1. Process and clean data from various sources
2. Perform exploratory data analysis (EDA)
3. Create meaningful visualizations and dashboards
4. Extract insights and patterns from data
5. Perform statistical analysis and hypothesis testing
6. Build data pipelines and ETL processes
7. Communicate findings clearly to non-technical stakeholders

Your communication style:
- Data-driven and analytical
- Clear explanations of complex concepts
- Visual representations when possible
- Focus on actionable insights
- Balance technical depth with accessibility

When analyzing data:
1. Understand the business question or goal
2. Assess data quality and completeness
3. Clean and prepare data for analysis
4. Perform exploratory analysis
5. Apply appropriate statistical methods
6. Create visualizations to communicate findings
7. Extract actionable insights and recommendations

Your technical skills:
- Data processing: Pandas, NumPy, data cleaning
- Visualization: Chart.js, Recharts, D3.js, Plotly
- Statistical analysis: Descriptive and inferential statistics
- Database: SQL queries, aggregations, joins
- Tools: Python for data analysis, JavaScript for web visualizations

Analysis deliverables should include:
## Data Analysis Report

### 1. Executive Summary
- Key findings (3-5 bullet points)
- Main insights
- Recommendations

### 2. Data Overview
- Data sources
- Data quality assessment
- Sample size and time period
- Key metrics

### 3. Exploratory Analysis
- Descriptive statistics
- Data distributions
- Correlations and relationships
- Outliers and anomalies

### 4. Visualizations
- Charts and graphs (describe what to show)
- Dashboard mockups
- Interactive elements

### 5. Detailed Findings
- Statistical tests performed
- Patterns discovered
- Trends identified
- Comparisons made

### 6. Insights and Recommendations
- What the data tells us
- Actionable recommendations
- Next steps
- Limitations and caveats

### 7. Technical Implementation
- Code snippets for data processing
- Visualization code (React components)
- SQL queries if needed

Remember: Your analysis should be clear enough for business stakeholders to understand and actionable enough for developers to implement.`;

export class DavidAgent extends BaseAgent {
  constructor(llmProvider: any) {
    const config: AgentConfig = {
      role: AgentRole.DAVID,
      name: 'David',
      description: 'Data Analyst - Processes data and performs analysis',
      systemPrompt: DAVID_SYSTEM_PROMPT,
      llmProvider,
    };
    super(config);
  }

  async processMessage(message: AgentMessage): Promise<AgentMessage | null> {
    this.log(`Processing message: ${message.type} from ${message.from}`);

    // Handle task assignments from Mike
    if (message.type === MessageType.TASK_ASSIGNMENT && message.to === this.config.role) {
      return await this.handleTaskAssignment(message);
    }

    // Handle questions or clarifications
    if (message.type === MessageType.AGENT_MESSAGE && message.to === this.config.role) {
      return await this.handleMessage(message);
    }

    return null;
  }

  async executeTask(task: Task): Promise<Task> {
    this.log(`Executing task: ${task.title}`);

    try {
      // Notify that work has started
      this.sendMessage(
        MessageType.AGENT_MESSAGE,
        `Starting data analysis for: ${task.title}`,
        AgentRole.MIKE
      );

      // Perform data analysis
      const analysis = await this.analyzeData(task.description);
      
      // Create visualizations
      const visualizations = await this.createVisualizations(task.description, analysis);
      
      // Extract insights
      const insights = await this.extractInsights(analysis);

      // Return completed task with analysis results
      return this.updateTask(task, TaskStatus.COMPLETED, {
        analysis,
        visualizations,
        insights,
      });
    } catch (error) {
      this.log(`Task execution failed: ${error}`, 'error');
      
      // Ask for clarification if needed
      this.sendMessage(
        MessageType.AGENT_QUESTION,
        `I encountered an issue analyzing data for "${task.title}": ${error}. Could you provide more details about the data source and analysis goals?`,
        AgentRole.MIKE
      );

      return this.updateTask(task, TaskStatus.FAILED, undefined, String(error));
    }
  }

  canHandleTask(task: Task): boolean {
    // David handles data analysis, visualization, and statistical tasks
    const keywords = [
      'data', 'analyze', 'analysis', 'visualization', 'visualize',
      'chart', 'graph', 'dashboard', 'statistics', 'statistical',
      'metric', 'kpi', 'report', 'insight', 'trend', 'pattern',
      'dataset', 'csv', 'excel', 'sql', 'query'
    ];
    
    return keywords.some(keyword => 
      task.title.toLowerCase().includes(keyword) ||
      task.description.toLowerCase().includes(keyword)
    );
  }

  /**
   * Handle task assignment from Mike
   */
  private async handleTaskAssignment(message: AgentMessage): Promise<AgentMessage> {
    this.log('Received task assignment');

    const task = message.metadata?.task as Task;
    
    if (!task) {
      return this.sendMessage(
        MessageType.TASK_REJECTED,
        'No task details provided',
        message.from
      );
    }

    // Check if I can handle this task
    if (!this.canHandleTask(task)) {
      return this.sendMessage(
        MessageType.TASK_REJECTED,
        `This task seems outside my expertise. Perhaps ${this.suggestBetterAgent(task)} would be better suited?`,
        message.from
      );
    }

    // Accept the task
    return this.sendMessage(
      MessageType.TASK_ACCEPTED,
      `I'll start analyzing the data for "${task.title}" right away.`,
      message.from,
      { taskId: task.id }
    );
  }

  /**
   * Handle general messages
   */
  private async handleMessage(message: AgentMessage): Promise<AgentMessage> {
    const response = await this.generateResponse(
      message.content,
      this.context?.messages
    );

    return this.sendMessage(
      MessageType.AGENT_RESPONSE,
      response,
      message.from
    );
  }

  /**
   * Analyze data
   */
  private async analyzeData(description: string): Promise<string> {
    const prompt = `Perform a comprehensive data analysis for the following requirement:

Requirement: "${description}"

Please provide a detailed analysis report:

# Data Analysis Report

## 1. Executive Summary
- 3-5 key findings
- Main insights
- Recommendations

## 2. Data Overview
- What data is needed
- Data sources
- Expected data structure
- Sample size considerations
- Time period

## 3. Analysis Plan
### Data Preparation
- Data cleaning steps
- Data transformation needed
- Handling missing values
- Outlier detection

### Exploratory Analysis
- Descriptive statistics to calculate
- Distributions to examine
- Relationships to explore
- Comparisons to make

### Statistical Methods
- Statistical tests to perform
- Metrics to calculate
- Confidence intervals
- Significance levels

## 4. Expected Findings
Based on the requirement, what patterns or insights might we discover?

## 5. Visualization Plan
What charts and graphs would best communicate the findings?
- Chart types (bar, line, pie, scatter, etc.)
- Key metrics to display
- Interactive elements
- Dashboard layout

## 6. Technical Implementation
### Data Processing Code
Provide Python-like pseudocode for data processing:
\`\`\`python
# Data loading and cleaning
# Statistical calculations
# Data transformations
\`\`\`

### Visualization Code
Provide React component structure for visualizations:
\`\`\`typescript
// Chart component using Recharts or Chart.js
// Dashboard layout
// Interactive filters
\`\`\`

## 7. Insights and Recommendations
- What actions should be taken based on the analysis?
- What further analysis might be needed?
- Limitations and caveats

Be specific and actionable.`;

    return await this.generateResponse(prompt);
  }

  /**
   * Create visualizations
   */
  private async createVisualizations(description: string, analysis: string): Promise<string> {
    const prompt = `Based on the requirement and analysis, create visualization specifications:

Requirement: "${description}"

Analysis:
${analysis}

Please provide detailed visualization specifications:

# Data Visualizations

## 1. Dashboard Overview
Describe the overall dashboard layout:
- Main metrics/KPIs at the top
- Primary visualizations
- Secondary visualizations
- Filters and controls

## 2. Individual Visualizations

For each visualization:

### Chart 1: [Chart Name]
- **Type**: Bar chart / Line chart / Pie chart / Scatter plot / etc.
- **Purpose**: What insight does this show?
- **Data**: What data is displayed?
- **Axes**: X-axis and Y-axis labels
- **Colors**: Color scheme and meaning
- **Interactions**: Hover, click, zoom, filter
- **Code**: React component structure using Recharts or Chart.js

Example:
\`\`\`typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export const SalesChart = ({ data }: { data: any[] }) => {
  return (
    <BarChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="sales" fill="#8884d8" />
    </BarChart>
  );
};
\`\`\`

### Chart 2: [Chart Name]
[Repeat for each chart]

## 3. Interactive Features
- Filters (date range, categories, etc.)
- Drill-down capabilities
- Export options
- Real-time updates

## 4. Responsive Design
- Mobile layout
- Tablet layout
- Desktop layout

## 5. Accessibility
- Color contrast
- Screen reader support
- Keyboard navigation

Provide complete, implementable code for each visualization.`;

    return await this.generateResponse(prompt);
  }

  /**
   * Extract insights
   */
  private async extractInsights(analysis: string): Promise<string[]> {
    const prompt = `Based on the analysis, extract the key insights and recommendations:

Analysis:
${analysis}

Provide a list of actionable insights in this format:
- [Insight]: [Specific finding] → [Recommended action]

Example:
- User Engagement: 70% of users drop off after the first step → Simplify the onboarding flow and add progress indicators
- Peak Usage: Traffic spikes every Monday at 9 AM → Ensure server capacity is scaled up during peak hours
- Feature Adoption: Only 20% of users use the advanced search → Add tooltips and tutorials to highlight this feature

Return 5-10 key insights with specific, actionable recommendations.`;

    const response = await this.generateResponse(prompt);
    
    // Split into individual insights
    return response
      .split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
      .map(line => line.trim());
  }

  /**
   * Suggest a better agent for the task
   */
  private suggestBetterAgent(task: Task): string {
    const description = task.description.toLowerCase();
    
    if (description.includes('requirements') || description.includes('prd') || description.includes('user story')) {
      return 'Emma (Product Manager)';
    }
    if (description.includes('architecture') || description.includes('design') || description.includes('technical')) {
      return 'Bob (System Architect)';
    }
    if (description.includes('code') || description.includes('implement') || description.includes('develop')) {
      return 'Alex (Full-stack Engineer)';
    }
    
    return 'another team member';
  }
}