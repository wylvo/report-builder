export default () => `
  <div>
    <div class="header">
      <div class="left">
        <h1>Users</h1>
      </div>
    </div>

    <section class="section-col">
      <!-- FORM -->
      <div class="container tab-form-ctn">
        <div class="tabs-ctn">
          <ul class="tab-list" role="tablist">
            <!-- <li><a class="tab-btn" id="tab_0" href="#">Form 0</a></li> -->
          </ul>
        </div>
        <div class="tabs-forms"></div>
      </div>

      <!-- TABLE -->
      <div class="container table-ctn">
        <div class="table-header">
          <div class="table-view">
            <div class="table-meta-data">
              <p>
                Total Users:
                <strong><span class="count">0</span></strong>
              </p>
            </div>
            <div class="table-pagination">
              <!-- <button disabled class="table-pagination-btn">
                <svg class="icons">
                  <use href="/img/icons.svg#icon-chevron-left"></use>
                </svg>
              </button>
              <span data-page="1" class="table-pagination-text">1</span>
              <button class="table-pagination-btn">
                <svg class="icons">
                  <use href="/img/icons.svg#icon-chevron-right"></use>
                </svg>
              </button> -->
            </div>
          </div>
        </div>
        <div class="table-wrapper">
          <table class="table-content">
            <thead>
              <tr>
                <th>Picture</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Username</th>
                <th>Initials</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
        <div class="table-footer">
          <div class="table-rows">
            <div>
              <label for="table-rows-per-page">Rows per page:</label>
              <select
                id="table-rows-per-page"
                name="table-rows-per-page"
                class="table-rows-per-page"
              >
                <option selected value="50">50</option>
                <option value="100">100</option>
                <option value="250">250</option>
                <option value="500">500</option>
                <option value="1000">1000</option>
              </select>
            </div>
          </div>
          <div class="table-pagination">
            <!-- <button data-page="" class="table-pagination-btn">
              <svg class="icons">
                <use href="/img/icons.svg#icon-chevron-left"></use>
              </svg>
            </button>
            <span class="table-pagination-text">1</span>
            <button data-page="" class="table-pagination-btn">
              <svg class="icons">
                <use href="/img/icons.svg#icon-chevron-right"></use>
              </svg>
            </button> -->
          </div>
        </div>
      </div>
    </section>

    <!-- NOTIFICATIONS -->
    <div class="notifications"></div>

    <!-- MODAL -->
    <div class="modal-ctn"></div>
    <div class="overlay hidden"></div>
  </div>
`;
