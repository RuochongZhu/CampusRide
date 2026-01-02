<template>
  <div class="min-h-screen bg-[#EDEEE8] pt-16">
    <div class="max-w-4xl mx-auto px-4 py-12">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-sm p-8 mb-6">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Carpool & Rideshare Disclaimer</h1>
        <p class="text-gray-600">Last Updated: January 2, 2026</p>
        <p class="text-sm text-gray-500 mt-2">Effective Date: January 2, 2026</p>
        <div class="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p class="text-sm text-yellow-800">
            <strong>IMPORTANT:</strong> Please read this disclaimer carefully before using the
            carpool/rideshare feature. By using this feature, you acknowledge and agree to
            the terms below.
          </p>
        </div>
      </div>

      <!-- Critical Notice -->
      <div class="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-6">
        <div class="flex items-start">
          <ExclamationCircleOutlined class="text-red-500 text-2xl mr-4 flex-shrink-0 mt-1" />
          <div>
            <h2 class="text-xl font-bold text-red-800 mb-3">THIS IS NOT A COMMERCIAL RIDESHARE SERVICE</h2>
            <p class="text-red-700 mb-4">
              CampusRide is NOT Uber, Lyft, or any other Transportation Network Company (TNC).
              We do NOT provide commercial transportation services. We are a community bulletin
              board that facilitates shared-expense carpool arrangements between private individuals.
            </p>
            <p class="text-red-700 font-semibold">
              Drivers may NOT profit from providing rides. Only actual shared expenses may be collected.
            </p>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="bg-white rounded-lg shadow-sm p-8 space-y-8">

        <!-- Legal Classification -->
        <section>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Legal Classification Under New York Law</h2>

          <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 class="text-lg font-semibold text-blue-800 mb-3">NY Vehicle & Traffic Law § 158-b</h3>
            <blockquote class="text-gray-700 italic border-l-4 border-blue-400 pl-4">
              "Shared-expense carpool" means the use of a motor vehicle for the purpose of
              providing transportation to two or more persons in such vehicle at the expense
              of each of them for the purpose of traveling to or from their places of employment,
              educational institutions, or any combination thereof.
            </blockquote>
            <p class="text-sm text-gray-600 mt-3">
              Source: <a href="https://www.nysenate.gov/legislation/laws/VAT/158-B" target="_blank" class="text-blue-600 hover:underline">
                New York State Senate - VTL § 158-b
              </a>
            </p>
          </div>

          <p class="text-gray-700 mb-4">
            CampusRide facilitates shared-expense carpool arrangements as defined under
            New York Vehicle and Traffic Law. This means:
          </p>
          <ul class="list-disc list-inside text-gray-700 space-y-2">
            <li>Drivers and passengers share actual travel expenses</li>
            <li>No commercial profit is generated from providing rides</li>
            <li>All parties are private individuals, not commercial operators</li>
            <li>Transportation is for travel to/from educational institutions or employment</li>
          </ul>
        </section>

        <!-- What We Are NOT -->
        <section>
          <h2 class="text-xl font-bold text-gray-900 mb-4">What CampusRide Is NOT</h2>

          <div class="grid md:grid-cols-2 gap-4">
            <div class="border border-red-200 rounded-lg p-4 bg-red-50">
              <h3 class="font-semibold text-red-800 mb-2">NOT a Transportation Network Company</h3>
              <p class="text-sm text-gray-700">
                We are not Uber, Lyft, Via, or any licensed TNC. We do not hold DMV permits
                or commercial transportation licenses.
              </p>
            </div>
            <div class="border border-red-200 rounded-lg p-4 bg-red-50">
              <h3 class="font-semibold text-red-800 mb-2">NOT an Insurance Provider</h3>
              <p class="text-sm text-gray-700">
                We do not provide any insurance coverage for rides, drivers, passengers,
                vehicles, or property.
              </p>
            </div>
            <div class="border border-red-200 rounded-lg p-4 bg-red-50">
              <h3 class="font-semibold text-red-800 mb-2">NOT a Transportation Provider</h3>
              <p class="text-sm text-gray-700">
                We do not employ drivers, own vehicles, or provide transportation services.
                We merely connect users.
              </p>
            </div>
            <div class="border border-red-200 rounded-lg p-4 bg-red-50">
              <h3 class="font-semibold text-red-800 mb-2">NOT a Party to Arrangements</h3>
              <p class="text-sm text-gray-700">
                All carpool arrangements are directly between users. CampusRide is not a
                party to any transportation arrangement.
              </p>
            </div>
          </div>
        </section>

        <!-- Expense Sharing Rules -->
        <section>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Expense Sharing Rules</h2>

          <h3 class="text-lg font-semibold text-gray-800 mb-3">Permitted Expenses</h3>
          <p class="text-gray-700 mb-4">
            Drivers may ONLY collect proportional shares of actual expenses:
          </p>
          <div class="overflow-x-auto mb-6">
            <table class="min-w-full border border-gray-200 rounded-lg">
              <thead class="bg-green-50">
                <tr>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-green-800">Expense Type</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-green-800">Description</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-green-800">Calculation</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr>
                  <td class="px-4 py-3 text-sm text-gray-700">Fuel Costs</td>
                  <td class="px-4 py-3 text-sm text-gray-600">Gas/electric charging for the trip</td>
                  <td class="px-4 py-3 text-sm text-gray-600">Total fuel cost ÷ number of people</td>
                </tr>
                <tr>
                  <td class="px-4 py-3 text-sm text-gray-700">Toll Fees</td>
                  <td class="px-4 py-3 text-sm text-gray-600">Highway and bridge tolls</td>
                  <td class="px-4 py-3 text-sm text-gray-600">Total tolls ÷ number of people</td>
                </tr>
                <tr>
                  <td class="px-4 py-3 text-sm text-gray-700">Parking Fees</td>
                  <td class="px-4 py-3 text-sm text-gray-600">Parking at destination</td>
                  <td class="px-4 py-3 text-sm text-gray-600">Total parking ÷ number of people</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 class="text-lg font-semibold text-gray-800 mb-3">Prohibited Charges</h3>
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p class="text-red-800 font-medium mb-2">Drivers may NOT charge for:</p>
            <ul class="list-disc list-inside text-gray-700 space-y-1">
              <li>Driver's time or labor</li>
              <li>Vehicle depreciation or maintenance</li>
              <li>Insurance costs</li>
              <li>Any profit margin</li>
              <li>Convenience or service fees</li>
            </ul>
          </div>

          <h3 class="text-lg font-semibold text-gray-800 mb-3">Example Calculation</h3>
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p class="text-gray-700 mb-3">
              <strong>Trip:</strong> Ithaca → New York City (250 miles one way)
            </p>
            <div class="space-y-2 text-sm text-gray-600">
              <p>Fuel cost (round trip): $60</p>
              <p>Tolls (round trip): $30</p>
              <p>Total expenses: $90</p>
              <p>Participants: 1 driver + 3 passengers = 4 people</p>
              <p class="font-semibold text-gray-800 mt-2">
                Per person share: $90 ÷ 4 = $22.50 each
              </p>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-300">
              <p class="text-green-700 text-sm">✅ <strong>Correct:</strong> Driver collects $22.50 from each passenger</p>
              <p class="text-red-700 text-sm mt-1">❌ <strong>Incorrect:</strong> Driver charges $50 per passenger (includes profit)</p>
            </div>
          </div>
        </section>

        <!-- Driver Responsibilities -->
        <section>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Driver Responsibilities</h2>

          <p class="text-gray-700 mb-4">
            By offering rides on CampusRide, you represent and warrant that:
          </p>

          <div class="space-y-3">
            <div class="flex items-start space-x-3">
              <CheckCircleOutlined class="text-green-500 text-lg flex-shrink-0 mt-1" />
              <div>
                <p class="text-gray-700 font-medium">Valid Driver's License</p>
                <p class="text-sm text-gray-600">You hold a valid driver's license appropriate for the vehicle</p>
              </div>
            </div>
            <div class="flex items-start space-x-3">
              <CheckCircleOutlined class="text-green-500 text-lg flex-shrink-0 mt-1" />
              <div>
                <p class="text-gray-700 font-medium">Personal Auto Insurance</p>
                <p class="text-sm text-gray-600">You maintain legally required personal auto insurance</p>
              </div>
            </div>
            <div class="flex items-start space-x-3">
              <CheckCircleOutlined class="text-green-500 text-lg flex-shrink-0 mt-1" />
              <div>
                <p class="text-gray-700 font-medium">Vehicle Authorization</p>
                <p class="text-sm text-gray-600">You own the vehicle or have permission from the owner to use it</p>
              </div>
            </div>
            <div class="flex items-start space-x-3">
              <CheckCircleOutlined class="text-green-500 text-lg flex-shrink-0 mt-1" />
              <div>
                <p class="text-gray-700 font-medium">Safe and Legal Operation</p>
                <p class="text-sm text-gray-600">You will operate the vehicle safely and in compliance with all traffic laws</p>
              </div>
            </div>
            <div class="flex items-start space-x-3">
              <CheckCircleOutlined class="text-green-500 text-lg flex-shrink-0 mt-1" />
              <div>
                <p class="text-gray-700 font-medium">No Impairment</p>
                <p class="text-sm text-gray-600">You are not under the influence of alcohol, drugs, or any impairing substances</p>
              </div>
            </div>
            <div class="flex items-start space-x-3">
              <CheckCircleOutlined class="text-green-500 text-lg flex-shrink-0 mt-1" />
              <div>
                <p class="text-gray-700 font-medium">Expense Sharing Only</p>
                <p class="text-sm text-gray-600">You will only collect actual shared expenses, never profit</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Passenger Responsibilities -->
        <section>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Passenger Responsibilities</h2>

          <p class="text-gray-700 mb-4">
            By requesting rides on CampusRide, you agree to:
          </p>

          <div class="space-y-3">
            <div class="flex items-start space-x-3">
              <CheckCircleOutlined class="text-green-500 text-lg flex-shrink-0 mt-1" />
              <div>
                <p class="text-gray-700 font-medium">Punctuality</p>
                <p class="text-sm text-gray-600">Be at the agreed pickup location on time</p>
              </div>
            </div>
            <div class="flex items-start space-x-3">
              <CheckCircleOutlined class="text-green-500 text-lg flex-shrink-0 mt-1" />
              <div>
                <p class="text-gray-700 font-medium">Communication</p>
                <p class="text-sm text-gray-600">Promptly communicate any changes to plans</p>
              </div>
            </div>
            <div class="flex items-start space-x-3">
              <CheckCircleOutlined class="text-green-500 text-lg flex-shrink-0 mt-1" />
              <div>
                <p class="text-gray-700 font-medium">Expense Payment</p>
                <p class="text-sm text-gray-600">Pay your agreed share of expenses</p>
              </div>
            </div>
            <div class="flex items-start space-x-3">
              <CheckCircleOutlined class="text-green-500 text-lg flex-shrink-0 mt-1" />
              <div>
                <p class="text-gray-700 font-medium">Respectful Behavior</p>
                <p class="text-sm text-gray-600">Behave respectfully and follow the driver's reasonable requests</p>
              </div>
            </div>
            <div class="flex items-start space-x-3">
              <CheckCircleOutlined class="text-green-500 text-lg flex-shrink-0 mt-1" />
              <div>
                <p class="text-gray-700 font-medium">Vehicle Care</p>
                <p class="text-sm text-gray-600">Not damage the vehicle or leave it in poor condition</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Insurance Notice -->
        <section>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Insurance Notice</h2>

          <div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-yellow-800 mb-3">⚠️ IMPORTANT INSURANCE INFORMATION</h3>
            <ul class="list-disc list-inside text-gray-700 space-y-2">
              <li>
                <strong>CampusRide provides NO insurance coverage.</strong> We do not carry
                liability insurance, collision insurance, or any other coverage for carpools.
              </li>
              <li>
                <strong>Drivers are responsible</strong> for maintaining their own personal
                auto insurance that covers their vehicle and liability.
              </li>
              <li>
                <strong>Passengers are not covered</strong> by any platform insurance.
                Any coverage depends on the driver's personal insurance policy.
              </li>
              <li>
                <strong>Verify your coverage:</strong> Drivers should check with their
                insurance provider to ensure carpooling is covered under their policy.
              </li>
            </ul>
          </div>
        </section>

        <!-- Assumption of Risk -->
        <section>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Assumption of Risk</h2>

          <div class="bg-gray-100 border border-gray-300 rounded-lg p-4 uppercase text-sm mb-4">
            <p class="text-gray-700">
              BY USING THE CARPOOL FEATURE, YOU ACKNOWLEDGE AND AGREE THAT YOU ASSUME ALL
              RISKS ASSOCIATED WITH CARPOOLING, INCLUDING BUT NOT LIMITED TO:
            </p>
          </div>

          <ul class="list-disc list-inside text-gray-700 space-y-2">
            <li>Risk of personal injury or death</li>
            <li>Risk of property damage or loss</li>
            <li>Risk of theft or criminal activity</li>
            <li>Risk of delays or failure to reach destination</li>
            <li>Risk of vehicle breakdown or accident</li>
            <li>Risk of financial loss from unpaid expenses</li>
            <li>Risk from actions or omissions of other users</li>
          </ul>

          <p class="text-gray-700 mt-4">
            You understand that traveling with strangers involves inherent risks. You are
            solely responsible for evaluating and assessing the safety and suitability of
            any carpool arrangement before participating.
          </p>
        </section>

        <!-- Disclaimer of Liability -->
        <section>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Disclaimer of Liability</h2>

          <div class="bg-gray-100 border border-gray-300 rounded-lg p-4 uppercase text-sm">
            <p class="text-gray-700 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY NEW YORK LAW, CAMPUSRIDE, ITS OFFICERS,
              DIRECTORS, EMPLOYEES, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY DAMAGES
              ARISING FROM OR RELATED TO:
            </p>
            <ul class="list-disc list-inside text-gray-700 space-y-1">
              <li>ANY CARPOOL ARRANGEMENT BETWEEN USERS</li>
              <li>PERSONAL INJURY, DEATH, OR PROPERTY DAMAGE</li>
              <li>ACTIONS OR OMISSIONS OF DRIVERS OR PASSENGERS</li>
              <li>VEHICLE ACCIDENTS OR BREAKDOWNS</li>
              <li>DELAYS OR FAILURE TO COMPLETE TRIPS</li>
              <li>DISPUTES BETWEEN USERS</li>
              <li>CRIMINAL ACTIVITY BY USERS</li>
              <li>ANY OTHER CLAIMS ARISING FROM CARPOOL USE</li>
            </ul>
          </div>

          <p class="text-gray-700 mt-4 text-sm">
            <strong>Exception:</strong> This disclaimer does not apply to liability arising
            from CampusRide's own gross negligence or willful misconduct.
          </p>
        </section>

        <!-- User Agreement -->
        <section>
          <h2 class="text-xl font-bold text-gray-900 mb-4">User Agreement</h2>

          <p class="text-gray-700 mb-4">
            By using the carpool feature on CampusRide, you confirm that you have read,
            understood, and agree to the following:
          </p>

          <div class="space-y-3 bg-gray-50 rounded-lg p-4">
            <div class="flex items-start space-x-3">
              <div class="w-5 h-5 rounded border border-gray-400 flex-shrink-0 mt-0.5 flex items-center justify-center">
                <CheckOutlined class="text-green-600 text-xs" />
              </div>
              <p class="text-gray-700 text-sm">
                I understand that CampusRide is NOT a Transportation Network Company (TNC)
                and does not provide commercial transportation services.
              </p>
            </div>
            <div class="flex items-start space-x-3">
              <div class="w-5 h-5 rounded border border-gray-400 flex-shrink-0 mt-0.5 flex items-center justify-center">
                <CheckOutlined class="text-green-600 text-xs" />
              </div>
              <p class="text-gray-700 text-sm">
                I understand this is a shared-expense carpool arrangement as defined under
                NY VTL § 158-b and drivers may only collect actual shared expenses.
              </p>
            </div>
            <div class="flex items-start space-x-3">
              <div class="w-5 h-5 rounded border border-gray-400 flex-shrink-0 mt-0.5 flex items-center justify-center">
                <CheckOutlined class="text-green-600 text-xs" />
              </div>
              <p class="text-gray-700 text-sm">
                I understand that CampusRide provides NO insurance coverage and I assume
                all risks associated with carpooling.
              </p>
            </div>
            <div class="flex items-start space-x-3">
              <div class="w-5 h-5 rounded border border-gray-400 flex-shrink-0 mt-0.5 flex items-center justify-center">
                <CheckOutlined class="text-green-600 text-xs" />
              </div>
              <p class="text-gray-700 text-sm">
                I agree not to hold CampusRide liable for any claims arising from my
                use of the carpool feature.
              </p>
            </div>
            <div class="flex items-start space-x-3">
              <div class="w-5 h-5 rounded border border-gray-400 flex-shrink-0 mt-0.5 flex items-center justify-center">
                <CheckOutlined class="text-green-600 text-xs" />
              </div>
              <p class="text-gray-700 text-sm">
                If I am a driver, I confirm that I have a valid license, proper insurance,
                and will only collect shared expenses.
              </p>
            </div>
          </div>
        </section>

        <!-- Legal References -->
        <section>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Legal References</h2>

          <div class="overflow-x-auto">
            <table class="min-w-full border border-gray-200 rounded-lg">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Law/Regulation</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Link</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr>
                  <td class="px-4 py-3 text-sm text-gray-700">NY VTL § 158-b</td>
                  <td class="px-4 py-3 text-sm text-gray-600">Shared-expense carpool definition</td>
                  <td class="px-4 py-3 text-sm">
                    <a href="https://www.nysenate.gov/legislation/laws/VAT/158-B" target="_blank" class="text-[#C24D45] hover:underline">
                      NY Senate
                    </a>
                  </td>
                </tr>
                <tr>
                  <td class="px-4 py-3 text-sm text-gray-700">NY VTL Article 44-B</td>
                  <td class="px-4 py-3 text-sm text-gray-600">TNC regulations (what we are NOT)</td>
                  <td class="px-4 py-3 text-sm">
                    <a href="https://law.justia.com/codes/new-york/vat/title-8/article-44-b/" target="_blank" class="text-[#C24D45] hover:underline">
                      Justia
                    </a>
                  </td>
                </tr>
                <tr>
                  <td class="px-4 py-3 text-sm text-gray-700">NY DMV TNC Info</td>
                  <td class="px-4 py-3 text-sm text-gray-600">TNC requirements and distinctions</td>
                  <td class="px-4 py-3 text-sm">
                    <a href="https://dmv.ny.gov/business/transportation-network-company-rideshare-information" target="_blank" class="text-[#C24D45] hover:underline">
                      NY DMV
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Contact -->
        <section>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
          <p class="text-gray-700 mb-4">
            If you have questions about this disclaimer or the carpool feature:
          </p>
          <div class="bg-gray-50 rounded-lg p-4">
            <p class="text-gray-700"><strong>CampusRide</strong></p>
            <p class="text-gray-700">Cornell University</p>
            <p class="text-gray-700">Ithaca, NY 14853</p>
            <p class="text-gray-700 mt-2">
              <strong>Email:</strong> legal@campusride.com
            </p>
          </div>
        </section>

      </div>

      <!-- Related Policies -->
      <div class="bg-white rounded-lg shadow-sm p-6 mt-6">
        <h3 class="text-lg font-semibold mb-4">Related Policies</h3>
        <div class="flex flex-wrap gap-4">
          <router-link to="/terms" class="text-[#C24D45] hover:underline">
            Terms of Service →
          </router-link>
          <router-link to="/privacy" class="text-[#C24D45] hover:underline">
            Privacy Policy →
          </router-link>
          <router-link to="/cookies" class="text-[#C24D45] hover:underline">
            Cookie Policy →
          </router-link>
        </div>
      </div>

      <!-- Back to Home -->
      <div class="mt-6 text-center">
        <router-link to="/home" class="text-[#C24D45] hover:underline">
          ← Back to Home
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import {
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CheckOutlined
} from '@ant-design/icons-vue'

onMounted(() => {
  window.scrollTo(0, 0)
})
</script>

<style scoped>
section {
  scroll-margin-top: 100px;
}
</style>
