# ReadAssist: A Rule-Based Expert System for Automated Phil-IRI Profiling and Targeted Reading Intervention

ReadAssist is an educational technology solution designed to automate the screening, diagnosis, profiling, and reading intervention pipelines mandated by the Department of Education (DepEd) under **DepEd Order No. 14, s. 2018**. Built as a deterministic, rule-based expert system, ReadAssist transforms the traditionally tedious, manual, and error-prone process of managing the **Philippine Informal Reading Inventory (Phil-IRI)** into a fast, transparent, and actionable workflow.

Unlike probabilistic machine learning implementations, ReadAssist implements an **expert inference engine** utilizing strict IF-THEN production rules. This guarantees 100% adherence to institutional education standards and provides transparent, explainable validation trails for every generated diagnosis.

---

## 📌 Problem Statement & Context

In the Philippine public school system, teachers handling large classrooms of 40 to 50 students face immense administrative overhead when performing individual student reading evaluations. The manual Phil-IRI framework requires instructors to:

* Manually compute Group Screening Test (GST) score partitions.
* Dynamically adjust passage entry thresholds.
* Tally specific behavioral reading miscues (e.g., omissions, substitutions, words-by-word reading) while tracking oral execution times.
* Cross-reference dense diagnostic matrices to prescribe specialized lesson plans.

Because this manual math and analysis process takes so much time, the crucial link between reading assessment and targeted student remediation is often delayed or omitted completely. ReadAssist eliminates this bottleneck by processing student testing analytics instantly, changing the teacher's role from manual clerical scoring to immediate classroom instruction.

---

## ⚙️ System Architecture & Workflow

ReadAssist coordinates four distinct expert system components into a single, cohesive frontend workspace:

```
  [ Student Fact Entry ] ---> [ Forward-Chaining Inference Engine ] 
                                             │
                                             ▼
  [ Actionable Intervention ] <--- [ Explanation Facility Trace ]

```

1. **Knowledge Base:** Codifies the complete collection of quantitative benchmarks, qualitative miscue interpretations, behavioral metrics, and DepEd-aligned intervention rules sourced from the *Phil-IRI Manual 2018*.
2. **Inference Engine (Forward-Chaining):** Begins with known student data inputs and iteratively evaluates rules to match raw symptoms with their root cognitive barriers.
3. **User Interface:** A fast, streamlined workspace that includes student rosters, testing modules, and analysis screens for effortless teacher interaction.
4. **Explanation Facility:** Embedded directly within the reports module to clearly break down the rules used, showing instructors exactly how the system calculated its final reading profiles.

---

## 🧠 Core Diagnostic & Evaluation Rules

The expert system executes calculations using standard mathematical models and evaluates rules based on strict criteria:

### 1. Mathematical Formulas

* **Reading Rate (WPM):**

$$\text{Reading Rate} = \left(\frac{\text{Total Passage Words}}{\text{Reading Time in Seconds}}\right) \times 60$$


* **Word Reading Score (%):**

$$\text{Word Reading Score} = \left(\frac{\text{Total Passage Words} - \text{Total Miscues}}{\text{Total Passage Words}}\right) \times 100$$


* **Comprehension Score (%):**

$$\text{Comprehension Score} = \left(\frac{\text{Correct Answers}}{\text{Total Questions}}\right) \times 100$$



### 2. Group Screening Test (GST) Matrices

* **Score $\ge$ 14:** Marked as **Exempted** (the student requires no immediate passage screening).
* **Score $\le$ 13:** Marked **For Intervention**; triggers adaptive entry-level recommendations:
* **GST Score 8 to 13:** Position starting entry **2 Grade Levels Below** current enrollment.
* **GST Score 0 to 7:** Position starting entry **3 Grade Levels Below** current enrollment.
* *Note: The system enforces a strict lower boundary, meaning entry thresholds never drop below Grade 3.*



### 3. Final Reading Profile Scoring Criteria

Rather than averaging results together, the system safely determines the student's overall profile by taking the **lower** level between their word reading performance and comprehension score:

| Profile Level | Word Reading Score | Comprehension Score |
| --- | --- | --- |
| **Independent** | $97\% - 100\%$ | $80\% - 100\%$ |
| **Instructional** | $90\% - 96\%$ | $59\% - 79\%$ |
| **Frustration** | $\le 89\%$ | $\le 58\%$ |

---

## 🚀 Key Modules & Applications

* **Roster and Screening Management:** Supports isolated language tracking for both English and Filipino configurations. It applies custom rules for Grade 3 (Filipino only) and automatically tracks low-score baselines across language options for Grades 4-6.
* **Testing Evaluation Suite:** Features a built-in stopwatch timer to log execution limits, a passage selector tool, itemized miscue logging counters, and structural behavior checklists.
* **Growth Tracking Module:** Performs analytical comparisons across pre-test and post-test metrics to easily measure and visualize overall student progress over time.
* **Batch Validation Engine:** Allows teachers to upload `.csv` or Excel spreadsheets to compare system-generated diagnoses with verified, expert-labeled records to ensure maximum classification accuracy.

---

## 🛠️ Technical Stack & Configuration

The application is built on a fast, modern web stack:

* **Core Interface Framework:** React 19 (Functional Components & Hooks Architecture)
* **Programming Language:** TypeScript (for type-safe data handling and stable rule definitions)
* **Build Architecture Tooling:** Vite 6
* **Styling Engine:** Tailwind CSS v4 + Motion
* **Icon System:** Lucide React
* **Data Processing Libraries:** PapaParse, ExcelJS, XLSX
* **Automated PDF Export Server:** Express + Puppeteer + tsx (for generating high-fidelity PDF report cards)

---

## 📦 Getting Started & Installation

### Prerequisites

Ensure you have [Node.js (v18 or higher)](https://www.google.com/search?q=https://nodejs.org/) installed on your machine.

### Setup Instructions

1. **Clone the Repository:**
```bash
git clone https://github.com/your-username/read-assist.git
cd read-assist

```


2. **Install Dependencies:**
```bash
npm install

```


3. **Launch the Development Server:**
```bash
npm run dev

```


The interactive interface will open at `http://localhost:3000`.

4. **Start the PDF Generation Server (Optional):**
To enable server-side high-fidelity PDF report exports, open a separate terminal window and run:
```bash
npm run pdf-server

```



---

## 👥 Proponents & Contributors

Developed as an academic capstone for **CS 404 - Expert Systems** at the **Technological Institute of the Philippines - Quezon City** (College of Computer Studies, Computer Science Department):

* **Alvin J. Guillermo** – Project Leader, Core System Programmer
* **Reuven James U. Gison** – Knowledge Engineer, System Developer
* **Rem Gabriel M. Gantang** – Data Analyst, Domain Researcher

**Presented to:** Dr. Karren V. de Lara (Professor)

**Knowledge Validation Experts:** 
* Ms. Ma. Lourdes J. Guillermo (Licensed DepEd Public School Teacher, Eulogio Rodriguez, Jr. Elementary School)

* Ms. Ana Cristi S. Pangilinan (Principal III, Southville Elementary School)

---

## 📚 References & Acknowledgments

ReadAssist builds directly upon the official guidelines and research documentation from the Department of Education:

1. **Department of Education (2018).** *DepEd Order No. 14, s. 2018: Policy Guidelines on the Administration of the Revised Philippine Informal Reading Inventory.* Pasig City, Philippines.
2. **Phil-IRI Handbook on Reading Intervention** (Appendix H).
3. Educational assessment data and classroom insights provided by Eulogio Rodriguez, Jr. Elementary School.
