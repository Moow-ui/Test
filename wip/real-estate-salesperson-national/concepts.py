import json
def C(term,d,tip,src=None):
    x=dict(term=term,definition=d,tip=tip)
    if src: x['source']=dict(org=src,year=2026)
    return x
ch={}
ch['property-characteristics']=dict(summary=[
"This chapter explains what counts as real estate and how land is described on paper. Questions often ask whether an item stays with the house, which characteristic of land explains a market effect, or how many acres a legal description covers.",
"Real property is land and everything permanently attached to it. Personal property can be moved. A fixture was once personal property but is now attached, so it goes with the house unless the contract says otherwise. Courts look at the method of attachment, adaptation, the relationship of the parties, intention, and agreement (MARIA). A tenant's business equipment is a trade fixture and may be removed before the lease ends. Crops planted each year are emblements.",
"Land is immobile, indestructible, and unique (non-homogeneous). Its economic traits are scarcity, improvements, permanence of investment, and area preference, also called situs. A legal description must locate the parcel exactly: metes and bounds uses directions and distances from a point of beginning, lot and block uses a recorded plat, and the rectangular survey uses townships of 36 sections, each of 640 acres."],
concepts=[C("Fixture","Personal property that has been attached to real estate so that it becomes part of the real property and transfers with it.","Wired-in, built-in, or custom-fitted usually means fixture."),
C("Trade fixture","An item a tenant attaches for business use; it stays the tenant's personal property and may be removed before the lease ends.","Business tenant's ovens and shelves"),
C("Emblements","Annual crops produced by labor, treated as personal property of the person who planted them.","Planted every year = emblements"),
C("Physical characteristics","Land is immobile, indestructible, and unique (non-homogeneous).","Uniqueness is why specific performance is possible."),
C("Metes and bounds","A legal description that follows directions and distances around a parcel from a point of beginning and back to it.","Must close at the point of beginning"),
C("Rectangular survey","A legal description system using townships (6 miles square, 36 sections) and sections (1 square mile, 640 acres).","Multiply the fractions by 640 acres.")],
points=["A wired-in chandelier is a fixture; exclude it in writing if the seller wants to keep it.","Area preference (situs) is an economic, not physical, characteristic.","A street address is not a legal description.","NE 1/4 of the SW 1/4 = 640 × 1/4 × 1/4 = 40 acres."])
ch['land-use-controls']=dict(summary=[
"This chapter covers who can control how land is used. Government controls come from four powers, and private controls come from deeds, subdivision rules, and agreements between neighbors.",
"Police power lets the government regulate land for public health and safety through zoning, building codes, and subdivision rules, without paying the owner. Eminent domain lets it take land for public use with just compensation, through condemnation. Taxation lets it tax land, and escheat passes property to the state when an owner dies with no will and no heirs. A use that was legal before zoning changed may continue as a nonconforming use, and a variance relieves an owner from a rule that causes unusual hardship.",
"Private controls include covenants, conditions, and restrictions (CC&Rs), often enforced by a homeowners' association. An easement is a right to use another's land: an easement appurtenant benefits a neighboring parcel, while an easement in gross benefits a person or company such as a utility. A license is personal, revocable permission. An encroachment is an improvement that crosses the property line without permission."],
concepts=[C("Police power","The government's right to regulate land use for public health, safety, and welfare, such as zoning and building codes.","Regulate, no payment"),
C("Eminent domain","The government's power to take private property for public use with just compensation; the process is condemnation.","Take + pay"),
C("Escheat","Property passes to the state when the owner dies without a will and without heirs.","No will, no heirs → state"),
C("Nonconforming use","A use that was legal before a zoning change and is allowed to continue, usually without expansion.","Grandfathered use"),
C("Variance","Permission to depart from a zoning rule when strict application would cause unusual hardship.","Odd lot, setback problem → variance"),
C("Easement in gross","An easement that benefits a person or company rather than a neighboring parcel, such as a utility line.","Utility easement"),
C("Encroachment","A building, fence, or other improvement that extends onto another person's land without permission.","Usually found by a survey")],
points=["Remember PETE: police power, eminent domain, taxation, escheat.","CC&Rs are private controls; zoning is a public control.","A license can be revoked; an easement is an interest in land."])
ch['ownership-estates']=dict(summary=[
"This chapter explains the different ways a person can hold an interest in real estate, how co-owners share title, and how liens rank against each other.",
"Fee simple absolute is the most complete ownership and carries the full bundle of rights, always subject to government powers. A life estate lasts for a person's life; when the measuring life is someone other than the owner, it is pur autre vie. After a life estate ends, the property returns to the grantor (reversion) or goes to a named third person (remainder). Leasehold estates include the estate for years, the periodic tenancy, the tenancy at will, and the tenancy at sufferance, where a tenant stays on without consent.",
"Joint tenants hold equal shares with the right of survivorship and need the four unities of time, title, interest, and possession. If one joint tenant sells, the buyer becomes a tenant in common. Condominium owners own their unit and an undivided interest in the common elements, while cooperative residents own shares and hold a proprietary lease. Liens generally rank by recording date, but property tax liens usually come first. A judgment is a general lien; a mortgage is a specific lien."],
concepts=[C("Fee simple absolute","The highest form of ownership, with no time limit, that can be sold or inherited.","Most complete ownership"),
C("Life estate","Ownership that lasts for the life of a named person; pur autre vie means measured by someone else's life.","Remainder = third party; reversion = back to grantor"),
C("Joint tenancy","Co-ownership with equal shares and the right of survivorship, requiring unity of time, title, interest, and possession.","T-T-I-P"),
C("Tenancy in common","Co-ownership with no right of survivorship; each owner's share passes to heirs and shares may be unequal.","Buyer from a joint tenant becomes a tenant in common"),
C("Tenancy at sufferance","A tenant who stays after the lease ends without the landlord's consent.","Weakest leasehold"),
C("Lien priority","Liens generally rank by recording date, but real property tax and special assessment liens usually come first.","Taxes first")],
points=["A condominium owner holds a unit plus an undivided interest in the common elements.","A judgment lien is general; a mortgage lien is specific.","The bundle of rights never includes breaking zoning laws."])
ch['deeds-title-recording']=dict(summary=[
"This chapter follows title from one owner to the next: what makes a deed valid, which deed protects the buyer most, and how public records and title insurance protect owners.",
"A valid deed is in writing, names a competent grantor and an identifiable grantee, contains a legal description, words of conveyance, and consideration, and is signed by the grantor. Title passes when the deed is delivered and accepted. A general warranty deed gives the most protection, a special warranty deed covers only the seller's time of ownership, and a quitclaim deed gives no warranties and is often used to clear a cloud on title.",
"Recording gives constructive notice to everyone, while actual notice is what a person really knows. The chain of title is the history of ownership, and an abstract summarizes the records. Title insurance pays for covered losses such as forgery; the owner's policy protects the buyer and the lender's policy protects the lender. Title can also pass involuntarily, for example by adverse possession, and real property given by will is a devise."],
concepts=[C("General warranty deed","A deed in which the grantor warrants title against defects from any time in the past.","Most protection for the buyer"),
C("Quitclaim deed","A deed that transfers whatever interest the grantor has, with no warranties.","Clears a cloud on title"),
C("Delivery and acceptance","Title passes when the grantor delivers the deed with intent to transfer and the grantee accepts it.","Signing or recording alone does not pass title."),
C("Constructive notice","Notice the law gives everyone through the public records, whether or not they looked.","Recording = constructive notice"),
C("Title insurance","Insurance that pays for covered losses from title defects, including hidden risks such as forgery.","Owner's policy protects the buyer."),
C("Adverse possession","Gaining title by open, notorious, hostile, exclusive, and continuous use for the period set by state law.","Involuntary alienation")],
points=["Recording is not needed for a deed to be valid between the parties.","Devise = real property by will; bequest = personal property by will.","A quiet title action removes a cloud on title by court order."])
ch['value-appraisal']=dict(summary=[
"This chapter covers what value means and how appraisers and licensees estimate it. Expect questions on the three approaches, depreciation, principles of value, and simple income calculations.",
"Market value is the most probable price in an open, competitive market; market price is what was actually paid. Value needs demand, utility, scarcity, and transferability. The principle of substitution says buyers will not pay more than the cost of an equal substitute, which supports the sales comparison approach. Regression lowers the value of the best house among poorer ones, and progression raises a modest home among better ones.",
"The sales comparison approach is best for homes. Adjustments are made to the comparables: if a comparable is better, subtract. The cost approach suits new and special-purpose buildings: cost new minus depreciation plus land value. Depreciation is physical deterioration, functional obsolescence (poor design), or external obsolescence (outside the property). The income approach divides net operating income by the cap rate; mortgage payments are not operating expenses. A licensee's CMA or BPO is not an appraisal."],
concepts=[C("Sales comparison approach","Estimating value by comparing recent sales of similar properties and adjusting the comparables for differences.","Comparable better, subtract"),
C("Cost approach","Cost to replace or reproduce the building, minus depreciation, plus land value.","Best for new or special-purpose buildings"),
C("Income approach","Value equals net operating income divided by the capitalization rate.","V = I ÷ R"),
C("Functional obsolescence","Loss in value from poor design or outdated features inside the property.","Four bedrooms, one bath"),
C("External obsolescence","Loss in value from factors outside the property, such as a new highway; usually incurable.","Outside the lot line"),
C("Gross rent multiplier","A quick income method: value equals monthly rent times the GRM.","$1,500 × 120 = $180,000"),
C("CMA","A licensee's comparison of recent sales and listings to help set a price; it is not an appraisal.","Licensee price opinion")],
points=["Value needs DUST: demand, utility, scarcity, transferability.","NOI = effective gross income minus operating expenses; debt service is not subtracted.","Adjust the comparable, never the subject."])
ch['contracts']=dict(summary=[
"This chapter covers how real estate contracts are formed, when they can be enforced, and what happens when someone fails to perform. It is the largest part of the largest content area.",
"A valid contract needs competent parties, offer and acceptance, consideration, and a legal purpose, and under the Statute of Frauds a contract to sell real estate must be in writing. A bilateral contract exchanges promises; a unilateral contract has a promise from one side only. A contract signed by a minor is voidable by the minor, while a contract for an illegal purpose is void. An executory contract still has duties to perform; an executed contract is complete.",
"Any change to an offer is a counteroffer that rejects the original offer. Earnest money shows good faith and is held in escrow. Contingencies, such as financing or inspection, must be met or waived before closing. After signing, the buyer holds equitable title until closing. An option gives the optionee the right, but not the duty, to buy. Remedies for breach include liquidated damages, compensatory damages, rescission, and specific performance."],
concepts=[C("Statute of Frauds","A rule that certain contracts, including contracts to sell real estate, must be in writing to be enforceable.","Real estate sale = in writing"),
C("Bilateral contract","A contract in which both parties exchange promises, such as a purchase agreement.","Promise for a promise"),
C("Voidable contract","A contract that one party may choose to cancel, such as one signed by a minor.","Void = no effect at all"),
C("Counteroffer","A response that changes the terms of an offer; it rejects the original offer.","Any change kills the offer"),
C("Equitable title","The buyer's interest in the property after signing a purchase contract and before closing.","Legal title passes at closing"),
C("Option contract","A contract giving the optionee the right, but not the duty, to buy at a set price within a set time.","Optionor must sell if exercised"),
C("Liquidated damages","An amount agreed in advance as full damages for a breach, often the earnest money.","Agreed damages")],
points=["Executed = fully performed; executory = still to be performed.","Time is of the essence makes deadlines strict.","A financing contingency lets the buyer cancel if a loan cannot be obtained."])
ch['agency']=dict(summary=[
"This chapter explains who the agent works for and what the agent owes to clients and to everyone else in the transaction.",
"The principal, or client, hires the agent; a customer is a party the agent works with but does not represent. A listing agreement makes the broker the agent and the seller the principal. Agency can be created expressly or implied by conduct, and it ends by completion, expiration, mutual agreement, death or incapacity of either party, destruction of the property, or revocation or renunciation.",
"An agent owes the client fiduciary duties: obedience, loyalty, disclosure, confidentiality, accounting, and reasonable care. The agent must keep the client's motivation and lowest price private and disclose any conflict of interest. Customers are owed honesty and fair dealing, which includes disclosure of known material defects. Dual agency, where one broker represents both sides, is allowed only where state law permits and with informed written consent of both parties."],
concepts=[C("Principal","The client who hires the agent and is owed fiduciary duties.","Client = principal"),
C("Customer","A party the agent works with but does not represent, owed honesty and fair dealing.","Customer gets honesty, not advocacy"),
C("Fiduciary duties","Obedience, loyalty, disclosure, confidentiality, accounting, and reasonable care.","OLD CAR"),
C("Dual agency","One broker represents both buyer and seller, allowed only where state law permits and with informed written consent.","Undisclosed dual agency is illegal."),
C("Implied agency","An agency created by the parties' conduct rather than a written or spoken agreement.","Put relationships in writing"),
C("Termination of agency","Agency ends by completion, expiration, mutual agreement, death or incapacity, destruction of the property, or revocation.","Death of the principal ends it")],
points=["Telling a buyer the seller's lowest price breaks loyalty and confidentiality.","Known material defects must be disclosed even to customers.","Commingling client money breaks the duty of accounting."])
ch['brokerage-practice']=dict(summary=[
"This chapter covers how brokerages work day to day: the types of listing agreements, handling other people's money, staying within the license, and federal rules that create risk for licensees.",
"Under an exclusive right-to-sell listing, the broker is paid if the property sells during the term, no matter who finds the buyer. Under an exclusive agency listing, the owner may sell alone without paying. An open listing pays only the broker who brings the buyer, and a net listing creates a conflict of interest and is banned or limited in many states. Earnest money goes into the broker's escrow or trust account; mixing it with personal funds is commingling.",
"Licensees must not give legal advice or draft legal documents. Federal antitrust law bars competing brokers from fixing commission rates, allocating markets, or boycotting a competitor. Before cold calling, check the Do Not Call lists. A broker may be liable for a salesperson's acts within the scope of the work, so supervision and E&O insurance matter. For federal tax purposes, a licensed salesperson is a statutory nonemployee when substantially all pay is based on sales, not hours, and a written contract says they will not be treated as an employee for federal taxes."],
concepts=[C("Exclusive right-to-sell","A listing in which the broker earns a commission if the property sells during the term, whoever finds the buyer.","Most common listing"),
C("Exclusive agency","A listing with one broker in which the owner keeps the right to sell alone without paying a commission.","Owner sells alone = no commission"),
C("Net listing","A listing in which the broker keeps everything above the seller's stated net amount; a conflict of interest.","Often illegal"),
C("Commingling","Mixing money that belongs to others with the licensee's own funds.","Spending it = conversion"),
C("Price fixing","Competing brokers agreeing on commission rates, a violation of federal antitrust law.","Commissions are always negotiable."),
C("Vicarious liability","A broker's responsibility for the acts of licensees done within the scope of their work.","Why brokers supervise")],
points=["Refer legal questions to an attorney to avoid the unauthorized practice of law.","E&O insurance covers negligent mistakes, not intentional fraud.","Check the Do Not Call lists before cold calling."])
ch['fair-housing']=dict(summary=[
"This chapter covers federal fair housing law, which applies in every state. Questions usually describe a situation and ask which illegal practice it shows or which class is protected.",
"The federal Fair Housing Act protects seven classes: race, color, religion, sex, national origin, disability, and familial status, meaning households with children under 18 and pregnant women. Sexual orientation and gender identity are not listed in the federal Act, but many states and cities protect them under their own laws. The Civil Rights Act of 1866 bars all racial discrimination in property, with no exceptions.",
"Steering guides buyers toward or away from areas because of a protected class. Blockbusting urges owners to sell by saying people of a protected class are moving in. Redlining refuses loans or insurance in an area because of who lives there. Ads must describe the property, not the kind of buyer wanted. Landlords must allow reasonable modifications, usually at the tenant's cost, and reasonable accommodations in rules for people with disabilities. A complaint may be filed with HUD within one year."],
concepts=[C("Protected classes","Race, color, religion, sex, national origin, disability, and familial status under the federal Fair Housing Act.","Seven federal classes","Fair Housing Act (42 U.S.C. 3604)"),
C("Steering","Directing buyers toward or away from neighborhoods because of a protected class.","Done by licensees"),
C("Blockbusting","Urging owners to sell by claiming people of a protected class are moving in.","Panic peddling"),
C("Redlining","Refusing loans or insurance in an area because of the protected class of its residents.","Done by lenders and insurers"),
C("Reasonable modification","A physical change to a unit that a tenant with a disability may make, usually at the tenant's expense.","Grab bars, ramps"),
C("Civil Rights Act of 1866","A federal law barring all racial discrimination in property transactions, with no exceptions.","Race, no exceptions")],
points=["\"No kids\" in an ad shows a familial status preference.","A HUD complaint must be filed within one year.","Marital status is not a federal Fair Housing Act class."])
ch['disclosures-environmental']=dict(summary=[
"This chapter covers what must be disclosed about a property and the environmental hazards that can affect value, health, and liability.",
"A material fact is one that would affect a reasonable buyer's decision or price. Known physical defects, such as a leaking roof or a cracked foundation, must be disclosed, while the seller's personal reasons for moving are confidential. Puffing is exaggerated opinion; misrepresentation and fraud are false statements of fact. For housing built before 1978, sellers and landlords must disclose known lead-based paint hazards and give the EPA pamphlet, and buyers get a 10-day chance to test unless it is waived or changed by agreement.",
"Radon is an odorless radioactive gas from the soil found only by testing. Asbestos is most dangerous when disturbed. Underground storage tanks can leak into soil and groundwater. Under CERCLA, or Superfund, present and past owners can be liable for cleanup, so buyers of commercial land often order a Phase I environmental site assessment to support the innocent landowner defense. Flood insurance is generally required for federally backed loans in special flood hazard areas."],
concepts=[C("Material fact","A fact that would affect a reasonable buyer's decision to buy or the price or terms.","Would it change the decision?"),
C("Lead-based paint disclosure","For housing built before 1978, sellers and landlords disclose known lead hazards and give the EPA pamphlet; buyers get a 10-day testing opportunity.","Pre-1978, 10 days","EPA/HUD lead disclosure rule (40 CFR 745 Subpart F; 24 CFR 35 Subpart A)"),
C("Radon","A colorless, odorless radioactive gas from uranium in soil and rock, found only by testing.","Test, then mitigate"),
C("Asbestos","A fiber once used in insulation and flooring that is most dangerous when damaged or disturbed.","Encapsulation is an option"),
C("CERCLA (Superfund)","A federal law making present and past owners and others liable for hazardous waste cleanup.","Strict, joint and several liability","CERCLA (42 U.S.C. 9601 et seq.)"),
C("Phase I ESA","A records and site review for signs of contamination, used as due diligence before buying.","Supports the innocent landowner defense")],
points=["Puffing is opinion; misrepresentation is a false statement of fact.","Underground storage tanks can leak into groundwater.","Flood insurance is generally required for federally backed loans in special flood hazard areas."])
ch['financing-settlement']=dict(summary=[
"This chapter covers how home loans work, the federal rules that protect borrowers, and how a sale is settled.",
"The promissory note is the promise to repay, and the mortgage or deed of trust pledges the property as security. The borrower is the mortgagor and the lender the mortgagee. A due-on-sale clause lets the lender call the loan when the property is sold, and an acceleration clause makes the debt due on default. In lien theory states the borrower keeps title; in title theory states the lender or a trustee holds it. Fannie Mae and Freddie Mac buy loans in the secondary market.",
"Conventional loans above 80% loan-to-value usually need private mortgage insurance. FHA loans are insured and VA loans are guaranteed. Under TRID, the Loan Estimate is due within 3 business days after application and the Closing Disclosure at least 3 business days before closing. RESPA bans kickbacks for referrals of settlement services. Under Regulation Z, a trigger term such as a down payment amount in an ad requires full disclosure including the APR. ECOA bars credit discrimination, including by marital status and age."],
concepts=[C("Promissory note","The borrower's written promise to repay the loan.","Note = promise; mortgage = security"),
C("Due-on-sale clause","A clause that lets the lender demand the full balance when the property is sold or transferred.","Also called an alienation clause"),
C("Secondary market","Investors such as Fannie Mae and Freddie Mac that buy loans from lenders.","Primary market makes loans"),
C("PMI","Private mortgage insurance protecting the lender, usually required on conventional loans above 80% LTV.","Less than 20% down"),
C("TRID","Federal rule requiring the Loan Estimate within 3 business days after application and the Closing Disclosure at least 3 business days before closing.","3 days before closing","CFPB TRID rule (12 CFR 1026)"),
C("RESPA kickbacks","RESPA bans fees or anything of value given for referring settlement services on federally related loans.","No referral fees","RESPA Section 8 (12 U.S.C. 2607)"),
C("Land contract","Seller financing in which the seller keeps legal title until paid and the buyer has possession and equitable title.","Also called contract for deed")],
points=["VA loans are guaranteed; FHA loans are insured.","Trigger terms in ads require the down payment, repayment terms, and APR.","ECOA protects marital status and age."])
ch['real-estate-math']=dict(summary=[
"This chapter collects the formulas used on the exam. All math questions ask you to apply or analyze, so practice until each step is automatic.",
"For area, multiply length by width; one acre is 43,560 square feet and a square yard is 9 square feet. Commission equals price times rate, and a split takes a percentage of that. The loan amount equals value times the loan-to-value ratio, and one discount point is 1% of the loan amount. Property tax equals assessed value times the tax rate; one mill is one tenth of a cent, or 0.001.",
"To find the price a seller needs to net a set amount, divide the net by one minus the commission rate. For prorations, find the daily amount and count the days each party owns, following the question's day count and who owns the closing day; taxes paid in arrears are a debit to the seller. PITI adds monthly principal and interest, taxes, and insurance. Value by income equals NOI divided by the cap rate."],
concepts=[C("Acre","A unit of land area equal to 43,560 square feet.","Memorize 43,560"),
C("Discount point","One percent of the loan amount, paid to lower the interest rate or as a fee.","Points on the loan, not the price"),
C("Mill","One tenth of a cent, or $1 of tax per $1,000 of assessed value.","25 mills = 0.025"),
C("Net to seller","Price needed = desired net ÷ (1 − commission rate).","Divide, don't add"),
C("Proration","Splitting costs by days of ownership; taxes paid in arrears are a debit to the seller and a credit to the buyer.","Daily amount × days"),
C("PITI","Monthly principal and interest plus one twelfth of annual taxes and insurance.","Divide annual costs by 12")],
points=["Commission = sale price × rate.","Monthly interest = loan × annual rate ÷ 12.","Percent change = (new − old) ÷ old."])
for k,v in ch.items():
    for p in v['summary']: assert 30<=len(p)<=600,(k,len(p))
    assert 3<=len(v['concepts'])<=7 and 2<=len(v['points'])<=6,k
    for c in v['concepts']: assert len(c['term'])<=40 and 10<=len(c['definition'])<=300 and 5<=len(c['tip'])<=200,(k,c['term'])
json.dump(dict(by='ai',chapters=ch),open('concepts.draft.json','w'),ensure_ascii=False,indent=2)
print(len(ch))
