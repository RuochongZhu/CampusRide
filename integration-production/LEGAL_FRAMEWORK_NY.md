# CampusRide Legal Framework - New York State Compliance

**Last Updated:** January 2, 2026
**Prepared for:** CampusRide Platform
**Jurisdiction:** New York State, United States

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [NY SHIELD Act Compliance](#2-ny-shield-act-compliance)
3. [Rideshare/Carpool Legal Classification](#3-ridesharecarpooling-legal-classification)
4. [Limitation of Liability Under NY Law](#4-limitation-of-liability-under-ny-law)
5. [Required Legal Documents](#5-required-legal-documents)
6. [Platform Liability Protections](#6-platform-liability-protections)
7. [Remaining Risks & Mitigations](#7-remaining-risks--mitigations)
8. [Implementation Checklist](#8-implementation-checklist)
9. [Legal References](#9-legal-references)

---

## 1. Executive Summary

CampusRide operates as a **community bulletin board platform** connecting Cornell University students for:
- Shared-expense carpool arrangements
- Peer-to-peer marketplace transactions
- Campus activities and events

**Legal Position:** CampusRide is NOT a Transportation Network Company (TNC), retailer, or service provider. It facilitates direct peer-to-peer connections without intermediary services.

**Key Compliance Requirements:**
- NY SHIELD Act (Data Security) - **MANDATORY**
- NY VTL § 158-b (Carpool Exemption) - Properly structured
- Section 230 Protection - User-generated content
- Contractual Liability Limitations - Enforceable under NY law

---

## 2. NY SHIELD Act Compliance

### 2.1 Overview

**Law:** Stop Hacks and Improve Electronic Data Security (SHIELD) Act
**Effective:** March 21, 2020
**Source:** https://ag.ny.gov/resources/organizations/data-breach-reporting/shield-act

**Applicability:** Any entity that owns or licenses computerized data containing private information of a New York resident, regardless of where the entity is located.

### 2.2 "Private Information" Definition

Under the SHIELD Act, "Private Information" includes:

| Category | Examples | CampusRide Status |
|----------|----------|-------------------|
| Name + SSN/Driver's License | Government IDs | ❌ NOT COLLECTED |
| Name + Account Number + Access Code | Financial accounts with passwords | ❌ NOT COLLECTED |
| Email + Password/Security Q&A | Email credentials with authentication | ⚠️ COLLECTED (email + password hash) |
| Biometric Information | Fingerprints, facial recognition | ❌ NOT COLLECTED |

**CampusRide Collection:**
- ✅ Email addresses (@cornell.edu)
- ✅ Hashed passwords (bcrypt)
- ✅ Location data (for ride matching)
- ✅ User-generated content (listings, messages)

### 2.3 Required Safeguards

#### Administrative Safeguards
| Requirement | Implementation |
|-------------|----------------|
| Designate security coordinator | Platform administrator designated |
| Risk assessment | Annual security review |
| Employee training | Security awareness for team members |
| Vendor management | Review third-party security (Supabase, hosting) |

#### Technical Safeguards
| Requirement | Implementation |
|-------------|----------------|
| Network security | HTTPS/TLS encryption in transit |
| Intrusion detection | Server monitoring and logging |
| Access controls | JWT authentication, role-based access |
| Data encryption | Passwords hashed with bcrypt |
| Secure disposal | Account deletion procedures |

#### Physical Safeguards
| Requirement | Implementation |
|-------------|----------------|
| Data storage security | Cloud-based (Supabase) with SOC 2 compliance |
| Disposal procedures | Secure data deletion on account removal |
| Access restrictions | Limited admin access |

### 2.4 Data Breach Notification Requirements

**If a data breach occurs:**

| Timeline | Requirement |
|----------|-------------|
| **Immediately** | Begin investigation, contain breach |
| **Within 30 days** | Notify affected NY residents |
| **Within 10 days** | If 500+ residents affected, notify AG |

**Notification Recipients:**
- New York Attorney General
- New York Department of State
- New York State Police
- Department of Financial Services (if applicable)

**Notification Content Must Include:**
- Nature of the breach
- Types of information compromised
- Contact information for inquiries
- Contact information for credit reporting agencies

### 2.5 Penalties for Non-Compliance

| Violation | Penalty |
|-----------|---------|
| Failure to notify | $20 per instance, max $250,000 |
| Failure to maintain reasonable safeguards | $5,000 per violation |
| Knowing/reckless violation | Up to $250,000 |

---

## 3. Rideshare/Carpool Legal Classification

### 3.1 Critical Distinction: Carpool vs TNC

**Transportation Network Company (TNC)** - What we are NOT:
- Uber, Lyft, Via, etc.
- Commercial transportation for profit
- Requires DMV licensing, insurance, background checks

**Shared-Expense Carpool** - What we ARE:
- Defined under NY Vehicle & Traffic Law § 158-b
- Private arrangements between individuals
- Cost-sharing only, no profit

### 3.2 NY VTL § 158-b Definition

> **"Shared-expense carpool"** means the use of a motor vehicle for the purpose of providing transportation to two or more persons in such vehicle at the expense of each of them for the purpose of traveling to or from their places of employment, educational institutions, or any combination thereof.

**Source:** https://www.nysenate.gov/legislation/laws/VAT/158-B

### 3.3 TNC Requirements (That We Avoid)

| TNC Requirement | CampusRide Status |
|-----------------|-------------------|
| DMV Permit | ❌ Not required |
| $1,250,000 liability insurance (during ride) | ❌ Not required |
| $75,000/$150,000/$25,000 insurance (waiting) | ❌ Not required |
| Driver background checks | ❌ Not required |
| NYC TLC License | ❌ Not required |
| Commercial vehicle registration | ❌ Not required |

**Source:** https://dmv.ny.gov/business/transportation-network-company-rideshare-information

### 3.4 Platform Conduct Rules

**✅ PERMITTED:**
- Users post ride requests/offers
- Users communicate directly
- Users arrange shared expenses privately
- Display cost estimates for reference only

**❌ PROHIBITED (To Maintain Carpool Status):**
- Platform collects commissions or service fees from rides
- Platform processes payments for rides
- Platform sets or mandates pricing
- Platform algorithmically matches drivers/passengers
- Platform provides insurance coverage
- Drivers profit beyond shared expenses

### 3.5 Expense Calculation

Legitimate shared expenses include:
- Proportional fuel costs
- Toll fees (split evenly)
- Parking fees (split evenly)
- Vehicle wear and tear is NOT included

**Example:**
```
Trip: Ithaca → Syracuse (60 miles each way)
Fuel cost: $20 total
Toll: $5

3 passengers + 1 driver = 4 people
Per person cost: ($20 + $5) / 4 = $6.25

❌ WRONG: Driver charges $15/person = profit
✅ CORRECT: Driver collects $6.25/person = expense sharing
```

---

## 4. Limitation of Liability Under NY Law

### 4.1 NY Courts' Position

**Key Precedent:** New York courts routinely enforce liability-limitation provisions when agreed to by sophisticated parties.

**Source:** https://www.jonathancooperlaw.com/blog/the-limits-of-liability-limitation-provisions-under-ny-law.cfm

### 4.2 Enforceable Provisions

| Provision | Enforceability | Notes |
|-----------|----------------|-------|
| Liability cap (e.g., max $100) | ✅ Enforceable | Must be reasonable |
| Exclude consequential damages | ✅ Enforceable | Standard practice |
| Exclude incidental damages | ✅ Enforceable | Standard practice |
| Exclude punitive damages | ✅ Enforceable | Standard practice |
| Arbitration clause | ✅ Enforceable | Must be conspicuous |
| Class action waiver | ✅ Enforceable | With individual arbitration |
| Forum selection (NY courts) | ✅ Enforceable | Reasonable for NY platform |

### 4.3 Unenforceable Provisions

| Provision | Enforceability | Reason |
|-----------|----------------|--------|
| Exclude gross negligence liability | ❌ Void | Public policy |
| Exclude willful misconduct liability | ❌ Void | Public policy |
| Exclude fraud liability | ❌ Void | Public policy |
| Unconscionably low cap (e.g., $1) | ❌ Void | Unconscionable |
| Exclude personal injury from negligence | ⚠️ Limited | Subject to scrutiny |

### 4.4 Drafting Principles

1. **Conspicuousness:** Liability limitations in CAPS or bold
2. **Mutual Assent:** User must affirmatively accept (checkbox)
3. **Reasonable Cap:** Not so low as to be unconscionable
4. **Carve-outs:** Acknowledge exceptions for gross negligence/fraud
5. **Severability:** If one provision fails, others survive

---

## 5. Required Legal Documents

### 5.1 Document Matrix

| Document | Priority | Purpose | Status |
|----------|----------|---------|--------|
| Terms of Service | P0 | User agreement, liability limits, arbitration | Required |
| Privacy Policy | P0 | SHIELD Act compliance, data practices | Required |
| Cookie Policy | P1 | Browser data disclosure | Required |
| Carpool Disclaimer | P0 | Non-TNC status, expense-sharing rules | Required |
| Marketplace Disclaimer | P1 | Platform non-liability for transactions | Required |
| Community Guidelines | P2 | User conduct standards | Recommended |

### 5.2 Terms of Service Key Sections

1. **Platform Nature**
   - Bulletin board/information service
   - NOT a TNC, retailer, or service provider
   - Facilitates peer-to-peer connections

2. **User Responsibilities**
   - Accurate information
   - Compliance with laws
   - Safe conduct

3. **Liability Limitations**
   - Cap on damages
   - Disclaimer of warranties
   - Assumption of risk

4. **Dispute Resolution**
   - Governing law: New York
   - Arbitration clause
   - Class action waiver
   - Forum: Tompkins County, NY

5. **Intellectual Property**
   - User content license
   - Platform IP rights

6. **Termination**
   - Platform right to terminate
   - User right to delete account

### 5.3 Privacy Policy Key Sections

1. **Information Collection**
   - Personal data collected
   - Automatic data collection
   - Third-party data

2. **Use of Information**
   - Service provision
   - Communications
   - Analytics

3. **Data Sharing**
   - With other users (as intended)
   - With service providers
   - Legal requirements

4. **Data Security**
   - SHIELD Act compliance
   - Technical measures
   - Organizational measures

5. **User Rights**
   - Access to data
   - Correction of data
   - Deletion of data
   - Data portability

6. **Data Retention**
   - Retention periods
   - Deletion procedures

7. **Breach Notification**
   - Commitment to notify
   - Notification procedures

---

## 6. Platform Liability Protections

### 6.1 Section 230 Protection

**47 U.S.C. § 230(c)(1):** "No provider or user of an interactive computer service shall be treated as the publisher or speaker of any information provided by another information content provider."

**Protection Scope:**
- ✅ User-posted ride listings
- ✅ User-posted marketplace items
- ✅ User messages and reviews
- ✅ Activity postings by users

**Exclusions (NOT protected):**
- ❌ Federal criminal liability
- ❌ Intellectual property claims
- ❌ Sex trafficking (FOSTA-SESTA)
- ❌ Platform's own content

### 6.2 Common Carrier / Platform Distinction

CampusRide is NOT a common carrier because:
- Does not transport persons or goods
- Does not hold itself out to serve all customers
- Does not charge for transportation services

### 6.3 Marketplace Intermediary Protection

As a marketplace facilitator (not seller):
- No liability for product defects
- No liability for seller misrepresentation
- No liability for transaction disputes

**Requirement:** Clear disclosure that platform is not a party to transactions.

---

## 7. Remaining Risks & Mitigations

### 7.1 Residual Risks

Even with all protections, liability may arise from:

| Risk | Description | Mitigation |
|------|-------------|------------|
| Knowledge of dangerous users | Platform knows user is dangerous but doesn't act | Robust reporting system, prompt removal |
| Platform negligence | Security breach due to platform's failure | SHIELD Act compliance, security measures |
| Misclassification as TNC | Platform operates as de facto TNC | Strict expense-sharing only, no payment processing |
| Inadequate consent | Users didn't clearly agree to terms | Checkbox consent, version tracking |
| Data breach | Unauthorized access to user data | Encryption, access controls, breach plan |

### 7.2 Risk Mitigation Checklist

- [ ] Implement user reporting system
- [ ] Create policy for removing problematic users
- [ ] Document all security measures
- [ ] Maintain consent records (who agreed, when, which version)
- [ ] Regular security audits
- [ ] Incident response plan
- [ ] Legal counsel review of documents

### 7.3 Insurance Considerations

**Recommended Coverage:**
- General liability insurance
- Cyber liability insurance
- Errors & omissions (E&O) insurance
- Directors & officers (D&O) if incorporated

**Entity Structure:**
- Consider forming NY LLC for personal asset protection
- Separate business assets from personal assets

---

## 8. Implementation Checklist

### 8.1 Immediate (P0) - Before Launch

- [x] Draft Terms of Service
- [x] Draft Privacy Policy
- [x] Draft Carpool Disclaimer
- [x] Implement consent mechanism (checkbox at registration)
- [x] Store consent records (timestamp, IP, version)
- [x] HTTPS encryption enabled
- [x] Password hashing (bcrypt)
- [x] Secure authentication (JWT)

### 8.2 Short-term (P1) - Within 30 Days

- [ ] Cookie Policy page
- [ ] Cookie consent banner
- [ ] User reporting system
- [ ] Account deletion functionality
- [ ] Data export functionality
- [ ] Security audit

### 8.3 Medium-term (P2) - Within 90 Days

- [ ] Community Guidelines
- [ ] Moderation policies
- [ ] Incident response plan
- [ ] Consider LLC formation
- [ ] Insurance evaluation
- [ ] Legal counsel review

---

## 9. Legal References

### 9.1 New York State Laws

| Law | Description | URL |
|-----|-------------|-----|
| NY SHIELD Act | Data security and breach notification | https://ag.ny.gov/resources/organizations/data-breach-reporting/shield-act |
| NY VTL § 158-b | Shared-expense carpool definition | https://www.nysenate.gov/legislation/laws/VAT/158-B |
| NY VTL Article 44-B | TNC regulations | https://law.justia.com/codes/new-york/vat/title-8/article-44-b/1691/ |

### 9.2 Federal Laws

| Law | Description | URL |
|-----|-------------|-----|
| 47 U.S.C. § 230 | Communications Decency Act - Platform protection | https://www.law.cornell.edu/uscode/text/47/230 |
| FOSTA-SESTA | Sex trafficking exception to Section 230 | N/A |

### 9.3 Regulatory Resources

| Agency | Resource | URL |
|--------|----------|-----|
| NY DMV | TNC/Rideshare Information | https://dmv.ny.gov/business/transportation-network-company-rideshare-information |
| NY DFS | Insurance Requirements | https://www.dfs.ny.gov/apps_and_licensing/property_insurers/trans_network_co_ride_sharing_faqs |
| NY AG | Data Breach Reporting | https://ag.ny.gov/resources/organizations/data-breach-reporting |

### 9.4 Legal Commentary

| Source | Topic | URL |
|--------|-------|-----|
| Jonathan Cooper Law | Liability Limitation in NY | https://www.jonathancooperlaw.com/blog/the-limits-of-liability-limitation-provisions-under-ny-law.cfm |

---

## Disclaimer

**This document is for informational purposes only and does not constitute legal advice.** CampusRide should consult with a licensed attorney in New York State before finalizing legal documents and launching the platform. Laws and regulations may change, and specific circumstances may require different approaches.

**Prepared by:** CampusRide Development Team
**Review Recommended:** Qualified NY-licensed attorney
**Next Review Date:** July 2026

---

*Document Version: 1.0*
*Created: January 2, 2026*
