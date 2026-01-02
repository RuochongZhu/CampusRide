<template>
  <footer class="bg-[#C24D45] text-white py-12">
    <div class="max-w-7xl mx-auto px-4">
      <div class="grid md:grid-cols-4 gap-8">
        <div>
          <h4 class="text-xl font-bold mb-4">CampusRide</h4>
          <p class="text-[#EDEEE8]">
            Connecting campus communities through shared journeys and
            experiences.
          </p>
        </div>
        <div>
          <h5 class="font-medium mb-4">Quick Links</h5>
          <ul class="space-y-2 text-[#EDEEE8]">
            <li><router-link to="/home" class="hover:text-white">Home</router-link></li>
            <li><router-link to="/rideshare" class="hover:text-white">Rideshare</router-link></li>
            <li><router-link to="/marketplace" class="hover:text-white">Marketplace</router-link></li>
            <li><router-link to="/activities" class="hover:text-white">Activities</router-link></li>
          </ul>
        </div>
        <div>
          <h5 class="font-medium mb-4">Legal</h5>
          <ul class="space-y-2 text-[#EDEEE8]">
            <li><router-link to="/terms" class="hover:text-white">Terms of Service</router-link></li>
            <li><router-link to="/privacy" class="hover:text-white">Privacy Policy</router-link></li>
            <li><router-link to="/cookies" class="hover:text-white">Cookie Policy</router-link></li>
            <li><router-link to="/carpool-disclaimer" class="hover:text-white">Carpool Disclaimer</router-link></li>
          </ul>
        </div>
        <div>
          <h5 class="font-medium mb-4">Connect</h5>
          <div class="flex space-x-4">
            <FacebookOutlined
              class="text-2xl cursor-pointer hover:text-[#63B5B7]"
            />
            <TwitterOutlined
              class="text-2xl cursor-pointer hover:text-[#63B5B7]"
            />
            <InstagramOutlined
              class="text-2xl cursor-pointer hover:text-[#63B5B7]"
            />
          </div>
          <div class="mt-4">
            <p class="text-sm text-[#EDEEE8]">Contact Us:</p>
            <p class="text-sm text-[#EDEEE8]">support@campusride.com</p>
          </div>
        </div>
      </div>
      <div
        class="mt-8 pt-8 border-t border-[#63B5B7] text-center text-[#EDEEE8]"
      >
        <p>&copy; {{ currentYear }} CampusRide. All rights reserved.</p>
        <p class="text-xs mt-2">Cornell University, Ithaca, NY</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import {
  FacebookOutlined,
  TwitterOutlined,
  InstagramOutlined,
} from "@ant-design/icons-vue";

const currentYear = computed(() => new Date().getFullYear())
</script>
