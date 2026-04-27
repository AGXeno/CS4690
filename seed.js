require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');
const Log = require('./models/Log');
const User = require('./models/User');

// Realistic CS catalogs per tenant. IDs are tenant-prefixed so the same
// number can exist in both schools without collision.
const catalogs = {
  uvu: [
    {
      id: 'cs1030',
      display: 'CS 1030',
      title: 'Foundations of Computer Science',
      credits: 3,
      prerequisites: null,
      description: 'Introduces the basics of computing, including computer hardware, and programming concepts and language. Explores how computers work and how a computer may be programmed. Includes a brief history of computers, programming languages, and computer numbering systems. Presents basic programming constructs; students produce a variety of introductory level programs. Surveys various computing professions. May be delivered hybrid and/or online.',
      labFee: 'Lab access fee of $45 for computers applies.'
    },
    {
      id: 'cs1380',
      display: 'CS 1380',
      title: 'Modern Programming Essentials',
      credits: 3,
      prerequisites: 'Mathematics at least equivalent to college algebra.',
      description: 'Provides a solid foundation in programming while introducing essential development tools and practices for beginning programmers.',
      labFee: null
    },
    {
      id: 'cs1400',
      display: 'CS 1400',
      title: 'Fundamentals of Programming',
      credits: 3,
      prerequisites: 'Math at least equivalent to high school algebra and trigonometry. CS 1030 recommended.',
      description: 'Introduces techniques and tools to formulate and solve problems where computer algorithms and programs are a core part of an effective, repeatable solution. Demonstrates algorithmic thinking using procedural programs composed of sequences of commands, functions, loops, conditionals, and basic data structures.',
      labFee: 'Lab access fee of $45 for computers applies.'
    },
    {
      id: 'cs1410',
      display: 'CS 1410',
      title: 'Object Oriented Programming',
      credits: 3,
      prerequisites: 'CS 1400 and Math equivalent to at least college algebra.',
      description: 'Emphasizes proper program structure using the core concepts of object-oriented programming: classes, objects, encapsulation, inheritance and polymorphism. Presents problems of increasing size and complexity requiring OOP techniques, standard libraries and other appropriate language constructs.',
      labFee: 'Lab access fee of $45 for computers applies.'
    },
    {
      id: 'cs1420',
      display: 'CS 1420',
      title: 'Accelerated Introduction to Programming',
      credits: 3,
      prerequisites: 'Math at least equivalent to high school algebra and trigonometry.',
      description: 'Introduces techniques, tools and skills necessary to effectively program computers. Demonstrates algorithmic thinking using procedural and object-oriented concepts. Presents problems of increasing size and complexity requiring standard libraries and other appropriate language constructs.',
      labFee: null
    },
    {
      id: 'cs2250',
      display: 'CS 2250',
      title: 'Java Programming',
      credits: 3,
      prerequisites: 'CS 1400 or CS 1420.',
      description: 'Covers practical Java programming in-depth, including abstract classes and interfaces, proper use of core packages and libraries, GUI design and implementation.',
      labFee: 'Lab access fee of $45 for computers applies.'
    },
    {
      id: 'cs2300',
      display: 'CS 2300',
      title: 'Discrete Mathematical Structures I',
      credits: 3,
      prerequisites: '(CS 1410 or INFO 2200) and MATH 1050 or higher.',
      description: 'Covers algebraic structures applied to computer programming. Includes logic, sets, elementary number theory, mathematical induction, recursion, algorithm complexity, combinatorics, relations, graphs, and trees.',
      labFee: 'Lab access fee of $45 for computers applies.'
    },
    {
      id: 'cs2310',
      display: 'CS 2310',
      title: 'Probability in Computing',
      credits: 3,
      prerequisites: 'CS 1400, CS 2300, MATH 1210.',
      description: 'Explores randomness as used throughout many areas of computer science, including algorithm design, machine learning, cryptography, distributed systems, networking, data mining, data privacy, and complexity theory. Covers basic probability concepts and methods used to understand and analyze random processes, and highlights applications of randomness in computing. Includes discrete and continuous probability, random variables, expectation, distributions, and sampling methods.',
      labFee: null
    },
    {
      id: 'cs2370',
      display: 'CS 2370',
      title: 'C++ Programming',
      credits: 3,
      prerequisites: 'CS 1410.',
      description: 'Introduces C++ programming for students with prior programming experience. Covers language fundamentals, core standard library components, error handling, value semantics, pointers and memory management, object-oriented programming, and templates.',
      labFee: 'Lab access fee of $45 for computers applies.'
    },
    {
      id: 'cs2420',
      display: 'CS 2420',
      title: 'Introduction to Algorithms and Data Structures',
      credits: 3,
      prerequisites: 'CS 1410.',
      description: 'Uses data abstraction to design and implement modular programs of medium size and complexity. Structures solutions to problems using common data structures and algorithms such as advanced arrays, lists, stacks, records, dynamic data structures, searching and sorting, vectors, trees, linked lists, and graphs. Evaluates alternative solutions to problems. Analyzes algorithmic complexity metrics in Big-O notation.',
      labFee: 'Lab access fee of $45 for computers applies.'
    },
    {
      id: 'cs3250',
      display: 'CS 3250',
      title: 'Java Software Development',
      credits: 3,
      prerequisites: 'CS 2420, matriculation to computer science or software engineering if computer science or software engineering major, and University Advanced Standing.',
      description: 'Covers object-oriented, functional programming and event-driven features of the Java Programming Language using common libraries, idioms, and software design patterns and principles. Includes abstract classes, interfaces, inner classes, lambda expressions, collections, streams, modern GUIs, I/O, serialization, socket programming, concurrency and parallel multicore programming.',
      labFee: 'Lab access fee of $45 for computers applies.'
    },
    {
      id: 'cs3260',
      display: 'CS 3260',
      title: 'C#/.NET Software Development',
      credits: 3,
      prerequisites: 'Matriculation to computer science or software engineering and University Advanced Standing.',
      description: 'Introduces the C# programming language and the .NET Framework. Discusses the various datatypes, built-in classes in namespaces, and how to develop user defined classes and namespaces. Includes programming assignments for console, GUI, and ASP.NET applications.',
      labFee: 'Lab access fee of $45 for computers applies.'
    },
    {
      id: 'cs3270',
      display: 'CS 3270',
      title: 'Python Software Development',
      credits: 3,
      prerequisites: 'CS 2420, matriculation to computer science or software engineering if computer science or software engineering major, and University Advanced Standing.',
      description: 'Explores optimal Python programming techniques, focusing on design and implementation. Outlines the lifecycle of a large-scale Python program. Includes creating elegant designs using modularization, best practices, design patterns, scaling applications beyond a single thread, reusable, scalable data pipelines, advanced Python features, and web development using Python, iterative software development.',
      labFee: 'Lab access fee of $45 for computers applies.'
    },
    {
      id: 'cs3310',
      display: 'CS 3310',
      title: 'Analysis of Algorithms',
      credits: 3,
      prerequisites: 'Matriculation into Computer Science or Software Engineering, and University Advanced Standing.',
      description: 'Develops and reinforces ability to write and mathematically analyze foundational computer algorithms. Includes formalizing NP-completeness, divide and conquer strategies, greedy algorithms, dynamic programming, backtracking, branch and bound, approximation algorithms and multicore parallelization.',
      labFee: 'Lab access fee of $45 for computers applies.'
    },
    {
      id: 'cs3360',
      display: 'CS 3360',
      title: 'Rust Software Development',
      credits: 3,
      prerequisites: 'CS 2420 and University Advanced Standing. Matriculation if Computer Science or Software Engineering major.',
      description: 'Introduces the Rust programming language. Provides an overview of common programming concepts and explores specific Rust topics in depth such as: value ownership, structures, enumerations, pattern matching, generics, strings, collections, error handling, iterators, closures, asynchronous programming and concurrency. Provides practical experience in writing programs in the Rust programming language through individual and group assignments.',
      labFee: null
    },
    {
      id: 'cs3370',
      display: 'CS 3370',
      title: 'C++ Software Development',
      credits: 3,
      prerequisites: 'CS 2370, (CS 2810 or ECE 4700), matriculation to computer science or software engineering, and University Advanced Standing.',
      description: 'Teaches C++ programming in a production environment, emphasizing mastery of the standard C++ library. Covers the following topics in-depth: const correctness, operator overloading, exception handling, exception-safe design, programming with assertions, automated unit testing, advanced memory management, generic programming with templates, containers, iterators, algorithms, concurrency, and functional programming. Introduces library development, common idioms, and other advanced topics. Emphasizes accepted software engineering practices.',
      labFee: 'Lab access fee of $45 for computers applies.'
    },
    {
      id: 'cs3380',
      display: 'CS 3380',
      title: 'JavaScript Software Development',
      credits: 3,
      prerequisites: 'CS 2420, (CS 2550 or DWDD 2720), matriculation into the Computer Science or Software Engineering program if a Computer Science or Software Engineering major, and University Advanced Standing.',
      description: 'Covers modern JavaScript features of functional programming, not JavaScript programming limited to the browser. Covers rest/spread operators, string interpolation, regular expressions, object property shorthand, computed properties, method properties, destructuring assignments using object and array matching, module export/import, classes & inheritance, promises, iterators, generators, map/set, reflection, localization & formatting. Introduces common idioms and design patterns. Emphasizes accepted software engineering practices.',
      labFee: 'Lab access fee of $45 for computers applies.'
    },
    {
      id: 'cs4470',
      display: 'CS 4470',
      title: 'Artificial Intelligence',
      credits: 3,
      prerequisites: 'CS 2420 and (CS 3250 or CS 3260 or CS 3270 or CS 3370 or CS 3380), and University Advanced Standing.',
      description: 'Presents theory, organization, concepts, and principles of artificial intelligence methodologies including neural networks, expert systems, machine learning algorithms, and genetic algorithms.',
      labFee: 'Lab access fee of $45 for computers applies.'
    },
    {
      id: 'cs4480',
      display: 'CS 4480',
      title: 'Digital Image Processing and Computer Vision',
      credits: 3,
      prerequisites: 'CS 2420 and University Advanced Standing. MATH 1210 and MATH 2270 strongly recommended.',
      description: 'Develops cutting-edge software solutions for processing multimedia. Covers digital sampling of analog signals, fundamental and advanced image processing techniques in the spatial and frequency domains, edge and line detection, photo enhancement, feature extraction, object recognition, and the integration of AI and machine learning methods. Provides hands-on experience with classical image processing techniques as well as modern AI-driven approaches.',
      labFee: 'Lab access fee of $45 for computers applies.'
    },
    {
      id: 'cs4490',
      display: 'CS 4490',
      title: 'Compiler Construction',
      credits: 3,
      prerequisites: 'CS 3450, CS 4380, CS 4450, and University Advanced Standing.',
      description: 'Builds on software created in CS 4380. Presents concepts necessary to create a modern compiler. Reinforces theoretical and practical software development skills from previous courses through an immersive, expressive approach to compiler construction.',
      labFee: 'Lab access fee of $45 for computers applies.'
    },
    {
      id: 'cs4500',
      display: 'CS 4500',
      title: 'Advanced Topics in Database',
      credits: 3,
      prerequisites: '(CS 3520 or INFO 3410) and University Advanced Standing.',
      description: 'Covers transaction processing, concurrency control techniques, database recovery techniques, database security and authorization, database integrity, distributed databases and client-server architectures, load balancing, data warehousing, data mining, database machines, mobile database, multimedia database, GIS, genome data management, data fragmentation, data encryption, locking, and deadlock.',
      labFee: 'Lab access fee of $45 for computers applies.'
    },
    {
      id: 'cs4620',
      display: 'CS 4620',
      title: 'Data Mining',
      credits: 3,
      prerequisites: 'CS 3520 and University Advanced Standing.',
      description: 'Introduces the process of knowledge discovery and the basic theory of automatic extracting models from data, validating those models, solving the problems of how to extract (mine) valid, useful, and previously unknown interesting patterns from a source (database or web) which contains an overwhelming amount of information. Explains various models (decision trees, association rules, linear model, clustering, bayesian network, neural network) and how to apply them in practice. Algorithms applied include searching for patterns in the data, using machine learning, and applying artificial intelligence techniques. Teaches how to implement several relevant algorithms and use existing tools to mine real-world, business driven databases.',
      labFee: 'Lab access fee of $45 for computers applies.'
    },
    {
      id: 'cs4690',
      display: 'CS 4690',
      title: 'Distributed Internet Application Development',
      credits: 3,
      prerequisites: 'CS 3660 and University Advanced Standing.',
      description: 'Constructs robust software solutions for large, heterogeneous software and hardware networks. Explores heterogeneous operating systems, data store architectures, and remote resource management. Focuses on the intricacies of remote services, data exchange mechanisms, and interactions among agents in peer-to-peer and client-server networks. Explores protocols and standards that ensure interoperability across diverse systems. Analyzes strategies to ensure confidentiality, availability, and data integrity in distributed applications.',
      labFee: 'Lab access fee of $45 for computers applies.'
    }
  ],
  // UofU CS catalog from the Kahlert School of Computing requirements export.
  // Titles are only included where the cross-listing reveals them (the export
  // itself doesn't carry titles or descriptions). Real UofU catalog page format
  // is preserved in rendering: Semester Credit Hours, Required Requisite(s),
  // Recommended background knowledge, Semesters Typically Offered, etc.
  uofu: [
    { id: 'cs1030', display: 'CS 1030', title: null, creditsMin: 3, creditsMax: 3,
      prerequisites: null, recommendedBackground: null,
      genEdDesignation: null, semestersOffered: 'Fall and Spring', crossListed: null },
    { id: 'cs1400', display: 'CS 1400', title: null, creditsMin: 4, creditsMax: 4,
      prerequisites: "Prerequisites: AP CalcAB score of 3+ OR AP CalcBC score of 3+ OR\nCorerequisites: 'C' or better in MATH 1050 OR 1060 OR 1080 OR 1210 OR 1215 OR 1250 OR 1310 OR 1311 OR Higher Math",
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: 'Fall and Spring', crossListed: null },
    { id: 'cs1410', display: 'CS 1410', title: null, creditsMin: 4, creditsMax: 4,
      prerequisites: "Prerequisites: 'C-' or better in CS 1400.\nCorequisites: MATH 1060 OR 1080 OR 1210 OR 1215 OR 1220 OR 1250 OR 1310 OR 1311 OR Higher Math OR AP CalcAB score 4+ OR AP CalcBC score 3+.",
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: 'All Terms', crossListed: null },
    { id: 'cs1420', display: 'CS 1420', title: null, creditsMin: 4, creditsMax: 4,
      prerequisites: "Corequisites: 'C' or better in MATH 1060 OR 1080 OR 1210 OR 1215 OR 1250 OR 1310 OR 1311 OR Higher Math OR AP CalcAB score of 4+ OR AP CalcBC score of 3+",
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: 'Fall and Spring', crossListed: null },
    { id: 'cs1810', display: 'CS 1810', title: 'Intro to Comp Systems', creditsMin: 3, creditsMax: 3,
      prerequisites: null, recommendedBackground: null,
      genEdDesignation: null, semestersOffered: 'Spring', crossListed: null },
    { id: 'cs1960', display: 'CS 1960', title: null, creditsMin: 1, creditsMax: 4,
      prerequisites: null, recommendedBackground: null,
      genEdDesignation: null, semestersOffered: 'Fall', crossListed: null },
    { id: 'cs2100', display: 'CS 2100', title: null, creditsMin: 3, creditsMax: 3,
      prerequisites: "Prerequisites: 'C-' or better in (CS 1410 OR CS 1420 OR AP CS-A score of 5) AND (MATH 1210 OR MATH 1220 OR MATH 1250 OR MATH 1310 OR MATH 1311 OR AP Calc AB score of 4+ OR AP Calc BC score of 3+ OR Higher Math)",
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: 'Fall and Spring', crossListed: null },
    { id: 'cs2420', display: 'CS 2420', title: null, creditsMin: 4, creditsMax: 4,
      prerequisites: "Prerequisites: 'C-' or better in CS 1410 OR CS 1420 OR AP CS-A score of 5",
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: 'All Terms', crossListed: null },
    { id: 'cs2950', display: 'CS 2950', title: null, creditsMin: 1, creditsMax: 4,
      prerequisites: null, recommendedBackground: null,
      genEdDesignation: null, semestersOffered: null, crossListed: null },
    { id: 'cs3011', display: 'CS 3011', title: null, creditsMin: 1, creditsMax: 1,
      prerequisites: "Prerequisites: Foundational Courses complete (('C-' or better in (CS 1400 AND CS 1410) OR CS 1420) AND ('B-' or better in CS 2420) AND ('C' or better in MATH 1210)) AND Major or Minor in Kahlert School of Computing or ECE",
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: 'Spring', crossListed: null },
    { id: 'cs3020', display: 'CS 3020', title: null, creditsMin: 1, creditsMax: 1,
      prerequisites: "Prerequisites: Foundational Courses complete (('C-' or better in (CS 1400 AND CS 1410) OR CS 1420) AND ('B-' or better in CS 2420) AND ('C' or better in MATH 1210)) AND Major or Minor in Kahlert School of Computing or ECE.",
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: 'Fall', crossListed: null },
    { id: 'cs3090', display: 'CS 3090', title: null, creditsMin: 3, creditsMax: 3,
      prerequisites: "Prerequisites: Foundational Courses complete (('C-' or better in (CS 1400 AND CS 1410) OR CS 1420) AND ('B-' or better in CS 2420) AND ('C' or better in MATH 1210)) AND Major or Minor in Kahlert School of Computing or ECE",
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: 'Fall and Spring', crossListed: null },
    { id: 'cs3100', display: 'CS 3100', title: null, creditsMin: 3, creditsMax: 3,
      prerequisites: "Prerequisites: 'C-' or better in (CS2100 OR MATH2200) AND Foundational Courses complete (('C-' or better in (CS1400 AND CS 1410)OR CS1420) AND ('B-' or better in CS2420) AND ('C' or better in MATH1210))AND Major or Minor in KSoC or ECE",
      recommendedBackground: null,
      genEdDesignation: 'QI - Methods Requirement: Quantitative Intensive',
      semestersOffered: 'Fall and Spring', crossListed: null },
    { id: 'cs3130', display: 'CS 3130', title: 'Engineering Probability and Statistics', creditsMin: 3, creditsMax: 3,
      prerequisites: "Prerequisites: 'C-' or better in (MATH 1220 OR 1320 OR 1321 OR AP Calc BC score of 4+) AND (('C-' or better in (CS 1400 AND 1410) OR 1420) AND ('B-' or better in CS 2420) AND ('C' or better in MATH 1210)) AND Major or Minor in School of Computing",
      recommendedBackground: null,
      genEdDesignation: 'QI - Methods Requirement: Quantitative Intensive',
      semestersOffered: 'Fall and Spring', crossListed: 'ECE3530 Eng Prob Stats' },
    { id: 'cs3190', display: 'CS 3190', title: 'Foundations of Data Analysis', creditsMin: 3, creditsMax: 3,
      prerequisites: 'Prerequisites: (≥"C-" in ((CS1400 AND CS1410) OR CS1420) AND (CS2100 OR MATH2200) AND (MATH2270 OR MATH2271)) AND ≥"B-" in CS2420 & ≥"C" in MATH 1210 AND Major in Kahlert School of Computing.\nCorequisites: ≥"C-" in CS3130 OR ECE3530 OR MATH3070.',
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: 'Fall', crossListed: 'DS3190 Found. of Data Analysis' },
    { id: 'cs3200', display: 'CS 3200', title: null, creditsMin: 3, creditsMax: 3,
      prerequisites: "Prerequisites: 'C-' or better in (MATH 2270 OR MATH 2271) AND (('C-' or better in (CS 1400 AND CS 1410) OR CS 1420) AND ('B-' or better in CS 2420) AND ('C' or better in MATH 1210)) AND Major or Minor in KSoC or ECE or Physics.",
      recommendedBackground: 'CS 2420 AND Integral Calculus.',
      genEdDesignation: null, semestersOffered: 'Spring', crossListed: null },
    { id: 'cs3350', display: 'CS 3350', title: null, creditsMin: 3, creditsMax: 3,
      prerequisites: 'Prerequisites: "C-" of better in (MATH 2270 OR MATH 2271) OR ("B" or better in MATH 2250)) AND Foundational Courses complete AND (Major OR Minor in Kahlert School of Computing OR ECE).',
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: 'Fall', crossListed: null },
    { id: 'cs3390', display: 'CS 3390', title: 'Ethics in Data Science', creditsMin: 3, creditsMax: 3,
      prerequisites: 'Prerequisites: ("C-" or better in ((CS 1400 AND CS 1410) OR CS 1420) AND "B-" or better in CS 2420 AND "C" or better in MATH 1210 AND Major in Kahlert School of Computing) OR ("C-" or better in DS 2500 AND Data Science Certificate Status).',
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: 'Fall and Spring', crossListed: 'DS3390 Ethics in Data Science' },
    { id: 'cs3500', display: 'CS 3500', title: null, creditsMin: 4, creditsMax: 4,
      prerequisites: "Prerequisites: Foundational Courses complete (('C-' or better in (CS 1400 AND CS 1410) OR CS 1420) AND ('B-' or better in CS 2420) AND ('C' or better in MATH 1210)) AND Major or Minor in Kahlert School of Computing or ECE or Major in Physics",
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: 'Fall and Spring', crossListed: null },
    { id: 'cs3505', display: 'CS 3505', title: null, creditsMin: 3, creditsMax: 3,
      prerequisites: "Prerequisites: 'C-' or better in CS 3500 AND Foundational Courses complete (('C-' or better in (CS 1400 AND CS 1410) OR CS 1420) AND ('B-' or better in CS 2420) AND ('C' or better in MATH 1210)) AND Major or Minor in Kahlert School of Computing or ECE",
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: 'Fall and Spring', crossListed: null },
    { id: 'cs3520', display: 'CS 3520', title: null, creditsMin: 3, creditsMax: 3,
      prerequisites: "Prerequisites: 'C-' or better in CS 3500 AND Foundational Courses complete (('C-' or better in (CS 1400 AND CS 1410) OR CS 1420) AND ('B-' or better in CS 2420) AND ('C' or better in MATH 1210)) AND Major or Minor in Kahlert School of Computing or ECE",
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: 'Fall', crossListed: null },
    { id: 'cs3535', display: 'CS 3535', title: null, creditsMin: 3, creditsMax: 3,
      prerequisites: 'Prerequisites: "C-" in CS 3500 AND Foundational Courses complete AND (Major OR Minor in Kahlert School of Computing or ECE).',
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: 'Spring', crossListed: null },
    { id: 'cs3540', display: 'CS 3540', title: null, creditsMin: 3, creditsMax: 3,
      prerequisites: "Prerequisites: Foundational Courses complete (('C-' or better in (CS 1400 AND CS 1410) OR CS 1420) AND ('B-' or better in CS 2420) AND ('C' or better in MATH 1210)) AND Major or Minor in Kahlert School of Computing or ECE",
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: 'Fall and Spring', crossListed: null },
    { id: 'cs3545', display: 'CS 3545', title: null, creditsMin: 3, creditsMax: 3,
      prerequisites: "Prerequisites: 'C-' or better in CS 3540 AND Foundational Courses complete (('C-' or better in (CS 1400 AND CS 1410) OR CS 1420) AND ('B-' or better in CS 2420) AND ('C' or better in MATH 1210)) AND Major or Minor in Kahlert School of Computing or ECE",
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: null, crossListed: null },
    { id: 'cs3550', display: 'CS 3550', title: null, creditsMin: 3, creditsMax: 3,
      prerequisites: "Prerequisites: 'C-' or better in CS 3500 AND Foundational Courses complete (('C-' or better in (CS 1400 AND CS 1410) OR CS 1420) AND ('B-' or better in CS 2420) AND ('C' or better in MATH 1210)) AND Major or Minor in Kahlert School of Computing or ECE",
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: 'Fall and Spring', crossListed: null },
    { id: 'cs3700', display: 'CS 3700', title: 'Digital System Design', creditsMin: 4, creditsMax: 4,
      prerequisites: 'Prerequisites: "C-" or better in ((PHYS 2220 OR AP Physics E&M score of 4 or better) OR (ECE 1240 AND ECE1245 AND ECE1050)) AND Major or Minor in Kahlert School of Computing or ECE.',
      recommendedBackground: null,
      genEdDesignation: 'QI - Methods Requirement: Quantitative Intensive',
      semestersOffered: 'Fall and Spring', crossListed: 'ECE3700 Digital System Design' },
    { id: 'cs3710', display: 'CS 3710', title: 'Computer Design Lab', creditsMin: 3, creditsMax: 3,
      prerequisites: 'Prerequisites: "C-" or better in (ECE 3700 OR CS 3700) AND (ECE 3810 OR CS 3810) AND Major or Minor in Kahlert School of Computing or ECE.',
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: 'Fall', crossListed: 'ECE3710 Computer Design Lab' },
    { id: 'cs3810', display: 'CS 3810', title: 'Computer Organization', creditsMin: 3, creditsMax: 3,
      prerequisites: "Prerequisites: (('C-' or better in (CS 1400 AND CS 1410) OR CS 1420) AND ('B-' or better in CS 2420) AND ('C' or better in MATH 1210)) AND Major OR Minor in Kahlert School of Computing.",
      recommendedBackground: null,
      genEdDesignation: 'QI - Methods Requirement: Quantitative Intensive',
      semestersOffered: 'Fall and Spring', crossListed: 'ECE3810 Computer Organization' },
    { id: 'cs3960', display: 'CS 3960', title: null, creditsMin: 1, creditsMax: 4,
      prerequisites: 'Prerequisites: Full Major status in Computer Science OR Computer Engineering OR Software Development',
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: 'Fall and Spring', crossListed: null },
    { id: 'cs3991', display: 'CS 3991', title: 'CE Junior Seminar', creditsMin: 1, creditsMax: 1,
      prerequisites: 'Prerequisites: Full Major status in Computer Engineering.',
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: 'Fall', crossListed: 'ECE3991 CE Junior Seminar' },
    { id: 'cs3992', display: 'CS 3992', title: 'Pre-Thesis/Clinic/Project', creditsMin: 3, creditsMax: 3,
      prerequisites: 'Prerequisites: "C-" or better in (ECE 3710 OR CS 3710) AND (CS 3991 OR ECE 3991) AND Full Major status in Computer Engineering.',
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: 'Spring', crossListed: 'ECE3992 Pre-Thesis/Clinic/Proj' },
    { id: 'cs4000', display: 'CS 4000', title: null, creditsMin: 3, creditsMax: 3,
      prerequisites: "Prerequisites: 'C-' or better in CS3505 & (WRTG3014 OR 3015 OR HONOR3200) & at least 9 credits in CS Electives & (('C-' or better in (CS1400 AND1410) OR CS1420) & ('B-' or better in CS2420) & ('C' or better in MATH1210)) & Major in KSoC/ECE",
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: 'Fall and Spring', crossListed: null },
    { id: 'cs4010', display: 'CS 4010', title: null, creditsMin: 3, creditsMax: 3,
      prerequisites: 'Prerequisites: "C-" or better in CS 3505 AND director approval AND Foundational Courses complete ((\'C-\' or better in (CS 1400 AND CS 1410) OR CS 1420) AND (\'B-\' or better in CS 2420) AND (\'C\' or better in MATH 1210)) AND Major or Minor in KSoC or ECE',
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: 'All Terms', crossListed: null },
    { id: 'cs4011', display: 'CS 4011', title: null, creditsMin: 1, creditsMax: 1,
      prerequisites: "Prerequisites: 'C-' or better in CS 3505 AND (CS 3550 OR CS 4530 OR CS 5530)",
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: 'Spring', crossListed: null },
    { id: 'cs4150', display: 'CS 4150', title: null, creditsMin: 3, creditsMax: 3,
      prerequisites: "Prerequisites: 'C-' or better in (CS 2100 OR MATH 2200) AND CS 3500 AND Foundational Courses complete (('C-' or better in (CS1400 AND CS1410) OR CS1420) AND ('B-' or better in CS2420) AND ('C' or better in MATH1210)) AND Major or Minor in KSoC or ECE",
      recommendedBackground: null,
      genEdDesignation: 'QI - Methods Requirement: Quantitative Intensive',
      semestersOffered: 'Fall and Spring', crossListed: null },
    { id: 'cs4230', display: 'CS 4230', title: 'Parallel Programming', creditsMin: 3, creditsMax: 3,
      prerequisites: "Prerequisites: 'C-' or better in CS 3505 AND 3810 AND Foundational Courses complete (('C-' or better in (CS 1400 AND CS 1410) OR CS 1420) AND ('B-' or better in CS 2420) AND ('C' or better in MATH 1210)) AND Major or Minor in KSoC or ECE",
      recommendedBackground: 'Experience in C programming.',
      genEdDesignation: null,
      semestersOffered: 'Fall', crossListed: null },
    { id: 'cs4300', display: 'CS 4300', title: null, creditsMin: 3, creditsMax: 3,
      prerequisites: 'Prerequisites: "C-" or better in CS 3350 AND Foundational Courses complete AND (Major OR Minor in Kahlert School of Computing OR ECE).',
      recommendedBackground: null, genEdDesignation: null,
      semestersOffered: 'Fall', crossListed: null }
  ]
};

// A few realistic logs so the demo isn't empty. All owned by student_uvu so
// the server-side "students see only their own logs" filter returns rows.
// uvuId/userId are filled in inside seed() once the student exists.
const sampleLogs = [
  { courseId: 'cs4690_uvu', date: '1/23/2026 1:23:36 PM',
    text: 'Initial commit. Set up Express server and connected to MongoDB Atlas.' },
  { courseId: 'cs4690_uvu', date: '1/24/2026 2:43:12 PM',
    text: 'Added User model with role and tenant enums per the practicum spec.' },
  { courseId: 'cs4690_uvu', date: '1/27/2026 5:58:10 PM',
    text: 'JWT login working end-to-end. Added cross-tenant validation middleware.' },
  { courseId: 'cs3380_uvu', date: '1/28/2026 3:53:52 PM',
    text: 'Worked through async/await patterns and promise chaining. Need to revisit generators before the midterm.' },
  { courseId: 'cs4690_uvu', date: '2/8/2026 7:41:28 PM',
    text: 'Wrote first integration tests with supertest. All 13 passing.' },
  { courseId: 'cs3380_uvu', date: '2/10/2026 7:27:40 PM',
    text: 'Tenant theming wired up via CSS swap. UVU green / UofU red look distinct.' }
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await Course.deleteMany({});
  await Log.deleteMany({});
  await User.deleteMany({});

  // One of every role per tenant — keeps the demo + grading walk-through quick.
  const seedUsers = [
    { username: 'root_uvu',    password: 'willy',   role: 'admin',   tenant: 'uvu' },
    { username: 'prof_uvu',    password: 'teach',   role: 'teacher', tenant: 'uvu' },
    { username: 'student_uvu', password: 'learn',   role: 'student', tenant: 'uvu',
      studentId: '10000001',
      courses: ['cs3380_uvu', 'cs4690_uvu'] },
    { username: 'root_uofu',    password: 'swoopy', role: 'admin',   tenant: 'uofu' },
    { username: 'prof_uofu',    password: 'teach',  role: 'teacher', tenant: 'uofu' },
    { username: 'student_uofu', password: 'learn',  role: 'student', tenant: 'uofu',
      studentId: '10000002',
      courses: ['cs3500_uofu', 'cs4150_uofu'] }
  ];
  // Keep a handle on the seeded student so we can attach their userId + ID
  // to the demo logs below (otherwise the server-side "students see only
  // their own logs" filter returns nothing and the demo looks broken).
  const userByName = {};
  for (const u of seedUsers) {
    const created = await User.create(u);
    userByName[u.username] = created;
    console.log(`Seeded ${u.role}: ${u.username} (${u.tenant})`);
  }

  for (const tenant of ['uvu', 'uofu']) {
    const docs = catalogs[tenant].map(c => ({
      _id: `${c.id}_${tenant}`,
      display: c.display,
      title: c.title || undefined,
      description: c.description || undefined,
      prerequisites: c.prerequisites || undefined,
      credits: c.credits,
      labFee: c.labFee || undefined,
      // UofU-specific fields (UVU entries don't supply these)
      creditsMin: c.creditsMin,
      creditsMax: c.creditsMax,
      semestersOffered: c.semestersOffered || undefined,
      crossListed: c.crossListed || undefined,
      genEdDesignation: c.genEdDesignation || undefined,
      recommendedBackground: c.recommendedBackground || undefined,
      tenant
    }));
    await Course.insertMany(docs);
    console.log(`Seeded ${docs.length} courses for ${tenant}`);
  }

  const studentUvu = userByName.student_uvu;
  await Log.insertMany(sampleLogs.map(log => ({
    ...log,
    uvuId: studentUvu.studentId,
    userId: studentUvu._id,
    tenant: 'uvu'
  })));
  console.log(`Seeded ${sampleLogs.length} logs for uvu (owner: ${studentUvu.username})`);

  await mongoose.disconnect();
  console.log('Done!');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
