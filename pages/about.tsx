import React from 'react'

import type { NextPage } from 'next'

import Banner from '../components/Banner'
import Image from 'next/image'
import BlogHead from '../components/BlogHead'

const AboutPage: NextPage = (props: any) => {
  return (
    <>
      <BlogHead title="Rocky Jaiswal - About" description="Rocky Jaiswal - Technical blogs" />

      <div className="container">
        <Banner />
        <div className="main">
          <div className="about">
            <div className="image_holder">
              <Image
                alt="Rocky Jaiswal"
                src="/images/Rocky_Jaiswal_2019.png"
                width="200px"
                height="200px"
              />
            </div>
            <div className="about_section">
              <h2>Profile</h2>
              <p>
                I am an experienced software engineer who has been building web and mobile
                applications professionally since 2002. I started programming way back in school
                using Pascal &amp; C (around 1996) and learned my craft through by developing,
                architecting and leading software projects. I love to code, I like to help people
                through code and I enjoy working with a good team of developers.
              </p>
              <p>
                Currently I enjoy working with NodeJS, ReactJS, TypeScript, Kotlin &amp; DevOps (AWS
                / Docker / Python). I was a Java programmer from 2002-2011, Ruby programmer for 3-4
                years after that. Now, I mostly work with TypeScript or JVM languages like Kotlin. I
                am also interested in functional programming languages like Clojure.
              </p>
              <p>
                I have developed numerous mobile / web applications and worked on building large
                enterprise software for McKinsey &amp; Company, Morgan Stanley, Goldman Sachs, Ergo
                among other clients in the US, UK , Europe and Japan. I have lived and worked in as
                many as as nine countries.
              </p>
              <p>
                On the personal front, I now live with my family in the beautiful city of Berlin,
                Germany. I am trying to learn German and plan to live here as long as God permits. I
                believe in __**Jesus**__ who has blessed me all my life from a small town in India
                to a major city in Europe. Jesus also healed me from a difficult disease in 2020.
              </p>
              <div className="skills about_section">
                <h2>Skills</h2>
                <div className="skill_matrix">
                  <div className="skill_section">
                    <h3>Programming languages</h3>
                    <ul>
                      <li>JavaScript / TypeScript</li>
                      <li>Java / Kotlin</li>
                      <li>Ruby / JRuby</li>
                      <li>Python (for scripting)</li>
                      <li>Clojure (elementary)</li>
                    </ul>
                  </div>
                  <div className="skill_section">
                    <h3>Frameworks / Libraries</h3>
                    <ul>
                      <li>ReactJS / React Native</li>
                      <li>NodeJS</li>
                      <li>Ruby on Rails</li>
                    </ul>
                  </div>
                  <div className="skill_section">
                    <h3>Databases</h3>
                    <ul>
                      <li>PostgreSQL / AWS RDS</li>
                      <li>Redis</li>
                      <li>MongoDB</li>
                    </ul>
                  </div>
                  <div className="skill_section">
                    <h3>DevOps</h3>
                    <ul>
                      <li>Docker</li>
                      <li>Kubernetes</li>
                      <li>Ansible</li>
                      <li>AWS</li>
                      <li>GCP</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="about_section">
              <h2>Experience</h2>
              <ul>
                <li>
                  <a target="_blank" href="https://klarna.com" rel="noreferrer">
                    Klarna
                  </a>{' '}
                  - Lead Software Engineer (Jun, 2019 - now)
                </li>
                <li>
                  <a
                    target="_blank"
                    href="https://www.mckinsey.de/funktionen/mckinsey-digital"
                    rel="noreferrer"
                  >
                    McKinsey Digital Labs
                  </a>{' '}
                  - Digital Expert (Aug, 2015 - May, 2019)
                </li>
                <li>
                  <a target="_blank" href="https://crealytics.com/" rel="noreferrer">
                    crealytics Gmbh
                  </a>{' '}
                  - Programmer (Nov, 2013 - Aug, 2015)
                </li>
                <li>
                  <a target="_blank" href="https://www.mckinsey.com/" rel="noreferrer">
                    McKinsey &amp; Company
                  </a>{' '}
                  - Programmer (Apr, 2011 to Nov, 2013)
                </li>
                <li>
                  <a target="_blank" href="https://xebia.com/" rel="noreferrer">
                    Xebia
                  </a>{' '}
                  - Programmer &amp; Scrum Master (Jul, 2009 to Mar, 2011)
                </li>
                <li>
                  <a target="_blank" href="https://www.genpact.com/" rel="noreferrer">
                    Headstrong
                  </a>{' '}
                  - Programmer (Oct, 2006 to Jun, 2009)
                </li>
                <li>
                  <a target="_blank" href="https://www.tcs.com/" rel="noreferrer">
                    Tata Consultancy Services
                  </a>{' '}
                  - Programmer (Oct, 2002 to Oct, 2006)
                </li>
              </ul>
            </div>
            <div className="about_section">
              <h2>Certifications / courses</h2>
              <ul>
                <li>
                  <a
                    target="_blank"
                    href="https://www.certmetrics.com/amazon/public/transcript.aspx?transcript=TT09FCG1DFFQ1K9T"
                    rel="noreferrer"
                  >
                    AWS Certified Developer Associate
                  </a>
                </li>
                <li>
                  <a
                    target="_blank"
                    href="https://drive.google.com/file/d/1BOlsokHNmZHKedNn9Tos7HS4AAYZ9nKN/view?usp=sharing"
                    rel="noreferrer"
                  >
                    Developing applications with GCP
                  </a>
                </li>
                <li>
                  <a
                    target="_blank"
                    href="https://drive.google.com/file/d/1tpdviDqrYTYT1JeQRYaB55SF-RIRC_v6/view?usp=sharing"
                    rel="noreferrer"
                  >
                    Kotlin for Java developers
                  </a>
                </li>
                <li>
                  <a
                    target="_blank"
                    href="https://drive.google.com/file/d/0B2miw8ex-mkQREhocWZEWTQyZkU/view?usp=sharing"
                    rel="noreferrer"
                  >
                    Certified Scrum Master
                  </a>
                </li>
                <li>
                  <a
                    target="_blank"
                    href="https://drive.google.com/file/d/1YlJKGXbxKEZVNNQfrH0LpNj9gsxxCPTe/view?usp=sharing"
                    rel="noreferrer"
                  >
                    SSR with React / Redux
                  </a>
                </li>
                <li>
                  <a
                    target="_blank"
                    href="https://drive.google.com/file/d/1RYbE2sgxDcI3V1_qaPqwDMb0XdGX2xm_/view?usp=sharing"
                    rel="noreferrer"
                  >
                    Functional Programming in Scala
                  </a>
                </li>
                <li>
                  <a
                    target="_blank"
                    href="https://drive.google.com/file/d/0B2miw8ex-mkQZDZNLUt5emdYX1E/view?usp=sharing"
                    rel="noreferrer"
                  >
                    MongoDB for DBAs
                  </a>
                </li>
                <li>
                  <a
                    target="_blank"
                    href="https://drive.google.com/file/d/0B2miw8ex-mkQdTFTdG5MMm9wZHc/view?usp=sharing"
                    rel="noreferrer"
                  >
                    Algorithms - Design &amp; Analysis (Stanford)
                  </a>
                </li>
                <li>Sun certified Java programmer (old)</li>
                <li>Sun certified Java web application developer (old)</li>
                <li>Some others</li>
              </ul>
            </div>
            <div className="about_section">
              <h2>Worth a mention</h2>
              <ul>
                <li>
                  Speaker at AgileNCR 2010, Gurgaon -
                  <a href="http://agilencr.org">Life without Agile</a>
                </li>
                <li>Speaker at Agile Tours 2010, Noida – Story Mapping in Agile</li>
                <li>
                  Speaker at IndicThreads Conference on Cloud Computing, Pune -
                  <a href="http://u10.indicthreads.com/">Rails and CouchDB on the Cloud</a>
                </li>
                <li>
                  Speaker at Ruby Conf India 2012 -
                  <a href="http://rubyconfindia.org/2012/talks.html">
                    http://rubyconfindia.org/2012/talks.html
                  </a>
                </li>
                <li>
                  Speaker at IndicThreads Conference on Software Development, NCR -
                  <a href="http://delhi12.indicthreads.com/">http://delhi12.indicthreads.com/</a>
                </li>
                <li>
                  Speaker at Ruby Conf India 2013 -
                  <a href="http://rubyconfindia.org/2013/talks.html">
                    http://rubyconfindia.org/2013/talks.html
                  </a>
                </li>
                <li>
                  Speaker at IndicThreads 2013 -
                  <a href="http://delhi13.indicthreads.com/">http://delhi13.indicthreads.com/</a>
                </li>
                <li>
                  Speaker at JSChannel 2013 -<a href="http://jschannel.com">http://jschannel.com</a>
                </li>
                <li>
                  Speaker at JRuby Conf 2015 -
                  <a href="http://2015.jrubyconf.eu">http://2015.jrubyconf.eu</a>
                </li>
                <li>
                  I have made small yet numerous open source contributions to Rails core and
                  omniauth-twitter among others
                </li>
                <li>I have some certifications as well which helped me learn</li>
              </ul>
            </div>
            <div className="about_section">
              <h2>Education</h2>
              <ul>
                <li>
                  Punjab Engineering College - Bachelor of Engineering (July 1998 to May 2002)
                </li>
              </ul>
            </div>
            <div className="about_section">
              <h2>LinkedIn</h2>
              <ul>
                <li>
                  For a detailed view of my projects / experience please visit LinkedIn -
                  <a
                    href="http://www.linkedin.com/in/rockyjaiswal"
                    target="_blank"
                    rel="noreferrer"
                  >
                    http://www.linkedin.com/in/rockyjaiswal
                  </a>
                </li>
              </ul>
            </div>
            <div className="about_section">
              <h2>Legal</h2>
              <p>
                I do not collect any data on this website. The site uses a twitter and disqus script
                to show my recent tweets and manage comments. I do not use these for any data
                collection whatsoever.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AboutPage
