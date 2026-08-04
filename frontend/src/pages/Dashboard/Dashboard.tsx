import MainLayout from "../../layouts/MainLayout";

function Dashboard() {
  return (
    <MainLayout>
      <h1 className="text-3xl font-bold mb-6">
        Dashboard
      </h1>

      <div className="grid grid-cols-4 gap-6">

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">Customers</h2>
          <p className="text-3xl font-bold mt-3">152</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">Products</h2>
          <p className="text-3xl font-bold mt-3">845</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">Sales</h2>
          <p className="text-3xl font-bold mt-3">₹2.5 Cr</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">Service</h2>
          <p className="text-3xl font-bold mt-3">42</p>
        </div>

      </div>
    </MainLayout>
  );
}

export default Dashboard;