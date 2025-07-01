        <template>
        <!-- trading history start-->
        <div class="flex flex-wrap mx-[-15px]">
          <div class="w-full px-[15px]">
            <div class="card-wrap">
              <div class="card-heading flex items-center justify-between mb-[20px]">
                <h3 class="card-title !mb-0">Trading History</h3>
                <a href="#" class="bg-primary text-white py-[10px] px-[15px] font-semibold rounded-[5px]">Download</a>
              </div>
              <div class="content">
                <!-- trading-table start-->
                <div class="trading-wrap overflow-x-auto">
                  <div class="responsive-wrap min-w-[1200px]">
                    <div
                        class="heading grid grid-cols-[50px_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-[10px] border-b border-[#000]/10 py-[10px]">
                      <p class=" text-dark text-[16px] leading-[1.5] font-semibold tracking-[-0.05px] dark:text-white">
                        SN
                      </p>
                      <p class="inline-flex items-center text-dark text-[16px] leading-[1.5] font-semibold tracking-[-0.05px] dark:text-white">
                        Open Time
                      </p>
                      <p class="inline-flex items-center text-dark text-[16px] leading-[1.5] font-semibold tracking-[-0.05px] dark:text-white">
                        Open Price
                      </p>
                      <p class="inline-flex items-center text-dark text-[16px] leading-[1.5] font-semibold tracking-[-0.05px] dark:text-white">
                        Close Time
                      </p>
                      <p class="inline-flex items-center text-dark text-[16px] leading-[1.5] font-semibold tracking-[-0.05px] dark:text-white">
                        Close Price
                      </p>
                      <p class="inline-flex items-center text-dark text-[16px] leading-[1.5]  font-semibold tracking-[-0.05px] dark:text-white">
                        Profit
                      </p>
                      <p class="inline-flex items-center text-dark text-[16px] leading-[1.5]  font-semibold tracking-[-0.05px] dark:text-white">
                        Commission
                      </p>
                      <p class="inline-flex items-center text-dark text-[16px] leading-[1.5]  font-semibold tracking-[-0.05px] dark:text-white">
                        Symbol
                      </p>
                      <p class="inline-flex items-center text-dark text-[16px] leading-[1.5]  font-semibold tracking-[-0.05px] dark:text-white">
                        Type
                      </p>
                      <p class="inline-flex items-center text-dark text-[16px] leading-[1.5]  font-semibold tracking-[-0.05px] dark:text-white">
                        Details
                      </p>
                    </div>
                    <div
                        class="content grid items-center grid-cols-[50px_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-[10px] border-b border-[#000]/10 py-[10px]">
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        1
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        2022.01.01 08:01:47
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        47199.83
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        2022.01.01 08:10:02
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        47254.29
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        $54.46
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        0
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        BTCUSD
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        Buy
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        <a href="#"
                           class="inline-block px-[10px] py-[5px] text-dark border border-dark rounded-[5px] transition-all duration-300 ease-linear hover:bg-primary hover:border-primary hover:text-white dark:bg-primary dark:text-white">View</a>
                      </p>
                    </div>
                    <div
                        class="content grid items-center grid-cols-[50px_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-[10px] border-b border-[#000]/10 py-[10px]">
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        2
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        2022.01.01 08:01:47
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        47199.83
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        2022.01.01 08:10:02
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        47254.29
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        $54.46
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        0
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        BTCUSD
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        Buy
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        <a href="#"
                           class="inline-block px-[10px] py-[5px] text-dark border border-dark rounded-[5px] transition-all duration-300 ease-linear hover:bg-primary hover:border-primary hover:text-white  dark:bg-primary dark:text-white">View</a>
                      </p>
                    </div>
                    <div
                        class="content grid items-center grid-cols-[50px_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-[10px] border-b border-[#000]/10 py-[10px]">
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        3
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        2022.01.01 08:01:47
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        47199.83
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        2022.01.01 08:10:02
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        47254.29
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        $54.46
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        0
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        BTCUSD
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        Buy
                      </p>
                      <p class="text-[14px] text-dark leading-[1.5] tracking-[-0.05px] dark:text-white">
                        <a href="#"
                           class="inline-block px-[10px] py-[5px] text-dark border border-dark rounded-[5px] transition-all duration-300 ease-linear hover:bg-primary hover:border-primary hover:text-white  dark:bg-primary  dark:text-white">View</a>
                      </p>
                    </div>
                  </div>
                </div>
                <!-- trading-table end-->
              </div>
            </div>
          </div>
        </div>
        <!-- trading history end-->
         <span class="text-[#0B9201] dark:text-primary">AI</span>
        </template>