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
            <li><a href="#" class="hover:text-white">About Us</a></li>
            <li><a href="#" class="hover:text-white">How it Works</a></li>
            <li><a href="#" class="hover:text-white">Safety</a></li>
            <li><a href="#" class="hover:text-white">Support</a></li>
          </ul>
        </div>
        <div>
          <h5 class="font-medium mb-4">Legal</h5>
          <ul class="space-y-2 text-[#EDEEE8]">
            <li><a href="#" class="hover:text-white">Terms of Service</a></li>
            <li><a href="#" class="hover:text-white">Privacy Policy</a></li>
            <li><a href="#" class="hover:text-white">Cookie Policy</a></li>
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
        </div>
      </div>
      <div
        class="mt-8 pt-8 border-t border-[#63B5B7] text-center text-[#EDEEE8]"
      >
        <p>&copy; 2025 CampusRide. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import {
  FacebookOutlined,
  TwitterOutlined,
  InstagramOutlined,
} from "@ant-design/icons-vue";
</script>
